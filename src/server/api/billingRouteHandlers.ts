type CheckoutDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  getPriceMap: () => Record<number, string>;
  findUserByClerkId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
    stripeCustomerId: string | null;
    subscriptionStatus: string | null;
  } | null>;
  createCheckoutSession: (params: {
    tier: number;
    priceId: string;
    clerkUserId: string;
    customerId: string | null;
    origin: string;
  }) => Promise<{ url: string | null }>;
};

type PortalDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  findCustomerIdByClerkUserId: (clerkUserId: string) => Promise<string | null>;
  createPortalSession: (params: {
    customerId: string;
    returnUrl: string;
  }) => Promise<{ url: string }>;
};

type BillingRequestInput = {
  method: string;
  body: unknown;
  headers: Headers;
};

export type BillingResponse =
  | { status: 200; body: { url: string } }
  | { status: 400 | 401 | 404 | 405 | 409 | 500; body: { error: string } };

const parseTier = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (![1, 2, 3].includes(parsed)) return null;
  return parsed;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const getRequestOrigin = (headers: Headers): string => {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (envBaseUrl) return envBaseUrl;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
};

export const createCheckoutSessionHandler =
  (deps: CheckoutDeps) =>
  async (input: BillingRequestInput): Promise<BillingResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    const clerkUserId = await deps.getAuthUserId();
    if (!clerkUserId) {
      return { status: 401, body: { error: "Unauthorized" } };
    }

    const payload = input.body as { tier?: unknown } | null;
    const tier = parseTier(payload?.tier);
    if (!tier) {
      return { status: 400, body: { error: "tier must be one of 1, 2, or 3." } };
    }

    const user = await deps.findUserByClerkId(clerkUserId);
    if (!user) {
      return { status: 404, body: { error: "User not found." } };
    }
    if (user.subscriptionStatus && ACTIVE_STATUSES.has(user.subscriptionStatus)) {
      return {
        status: 409,
        body: {
          error:
            "You already have an active subscription. Use Billing to switch plans or manage your subscription.",
        },
      };
    }

    const priceMap = deps.getPriceMap();
    const priceId = priceMap[tier];
    if (!priceId) {
      return { status: 500, body: { error: "Subscription pricing is misconfigured." } };
    }

    try {
      const session = await deps.createCheckoutSession({
        tier,
        priceId,
        clerkUserId,
        customerId: user.stripeCustomerId,
        origin: getRequestOrigin(input.headers),
      });
      if (!session.url) {
        return { status: 500, body: { error: "Unable to create checkout session." } };
      }
      return { status: 200, body: { url: session.url } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create checkout session.";
      console.error("create-checkout-session failed:", {
        clerkUserId,
        tier,
        priceId,
        hasCustomerId: Boolean(user.stripeCustomerId),
        message,
      });
      return {
        status: 500,
        body: {
          error:
            process.env.NODE_ENV === "development"
              ? message
              : "Unable to create checkout session.",
        },
      };
    }
  };

export const createPortalSessionHandler =
  (deps: PortalDeps) =>
  async (input: BillingRequestInput): Promise<BillingResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    const clerkUserId = await deps.getAuthUserId();
    if (!clerkUserId) {
      return { status: 401, body: { error: "Unauthorized" } };
    }

    const customerId = await deps.findCustomerIdByClerkUserId(clerkUserId);
    if (!customerId) {
      return { status: 404, body: { error: "No subscription found for this user." } };
    }

    try {
      const session = await deps.createPortalSession({
        customerId,
        returnUrl: `${getRequestOrigin(input.headers)}/billing`,
      });
      return { status: 200, body: { url: session.url } };
    } catch {
      return {
        status: 500,
        body: { error: "Unable to create billing portal session." },
      };
    }
  };
