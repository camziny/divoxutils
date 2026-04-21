import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

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

type PayPalCheckoutDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  getPlanMap: () => Record<number, string>;
  isPayPalEnabled: () => boolean;
  findUserByClerkId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
    subscriptionStatus: string | null;
  } | null>;
  createPayPalSubscription: (params: {
    tier: number;
    planId: string;
    clerkUserId: string;
    origin: string;
  }) => Promise<{
    id: string;
    status: string | null;
    approveUrl: string | null;
    payerId: string | null;
  }>;
  recordPayPalSubscription: (params: {
    clerkUserId: string;
    paypalSubscriptionId: string;
    paypalPayerId: string | null;
    subscriptionStatus: string | null;
    subscriptionPriceId: string;
  }) => Promise<void>;
};

type PayPalChangePlanDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  getPlanMap: () => Record<number, string>;
  isPayPalEnabled: () => boolean;
  findUserByClerkId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
    subscriptionProvider: "stripe" | "paypal" | null;
    subscriptionStatus: string | null;
    subscriptionPriceId: string | null;
    pendingSubscriptionPriceId: string | null;
    paypalSubscriptionId: string | null;
  } | null>;
  revisePayPalSubscriptionPlan: (params: {
    paypalSubscriptionId: string;
    planId: string;
    origin: string;
  }) => Promise<{ approveUrl: string | null }>;
  updatePendingSubscriptionPriceId: (params: {
    clerkUserId: string;
    pendingSubscriptionPriceId: string;
  }) => Promise<void>;
};

type PayPalCancelDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  isPayPalEnabled: () => boolean;
  findUserByClerkId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
    subscriptionProvider: "stripe" | "paypal" | null;
    paypalSubscriptionId: string | null;
  } | null>;
  cancelPayPalSubscription: (params: {
    paypalSubscriptionId: string;
    reason: string;
  }) => Promise<void>;
  markPayPalSubscriptionCancelAtPeriodEnd: (params: {
    clerkUserId: string;
  }) => Promise<void>;
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

export const getRequestOrigin = (headers: Headers): string => {
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
    if (isActiveSubscriptionStatus(user.subscriptionStatus)) {
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

export const createPayPalSubscriptionHandler =
  (deps: PayPalCheckoutDeps) =>
  async (input: BillingRequestInput): Promise<BillingResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    if (!deps.isPayPalEnabled()) {
      return {
        status: 404,
        body: { error: "PayPal subscriptions are not available right now." },
      };
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

    if (isActiveSubscriptionStatus(user.subscriptionStatus)) {
      return {
        status: 409,
        body: {
          error:
            "You already have an active subscription. Use Billing to switch plans or manage your subscription.",
        },
      };
    }

    const planMap = deps.getPlanMap();
    const planId = planMap[tier];
    if (!planId) {
      return { status: 500, body: { error: "PayPal pricing is misconfigured." } };
    }

    try {
      const subscription = await deps.createPayPalSubscription({
        tier,
        planId,
        clerkUserId,
        origin: getRequestOrigin(input.headers),
      });
      if (!subscription.approveUrl) {
        return { status: 500, body: { error: "Unable to start PayPal checkout." } };
      }

      if (isActiveSubscriptionStatus(subscription.status)) {
        await deps.recordPayPalSubscription({
          clerkUserId,
          paypalSubscriptionId: subscription.id,
          paypalPayerId: subscription.payerId,
          subscriptionStatus: subscription.status,
          subscriptionPriceId: planId,
        });
      }

      return { status: 200, body: { url: subscription.approveUrl } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create PayPal subscription.";
      console.error("create-paypal-subscription failed:", {
        clerkUserId,
        tier,
        planId,
        message,
      });
      return {
        status: 500,
        body: {
          error:
            process.env.NODE_ENV === "development"
              ? message
              : "Unable to create PayPal subscription.",
        },
      };
    }
  };

export const changePayPalPlanHandler =
  (deps: PayPalChangePlanDeps) =>
  async (input: BillingRequestInput): Promise<BillingResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    if (!deps.isPayPalEnabled()) {
      return {
        status: 404,
        body: { error: "PayPal subscriptions are not available right now." },
      };
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
    if (
      user.subscriptionProvider !== "paypal" ||
      !isActiveSubscriptionStatus(user.subscriptionStatus) ||
      !user.paypalSubscriptionId
    ) {
      return { status: 409, body: { error: "No active PayPal subscription found." } };
    }

    const planMap = deps.getPlanMap();
    const planId = planMap[tier];
    if (!planId) {
      return { status: 500, body: { error: "PayPal pricing is misconfigured." } };
    }
    if (planId === user.subscriptionPriceId) {
      return { status: 409, body: { error: "You are already on that tier." } };
    }
    if (planId === user.pendingSubscriptionPriceId) {
      return {
        status: 409,
        body: { error: "This tier is already scheduled for your next billing cycle." },
      };
    }

    try {
      const result = await deps.revisePayPalSubscriptionPlan({
        paypalSubscriptionId: user.paypalSubscriptionId,
        planId,
        origin: getRequestOrigin(input.headers),
      });

      await deps.updatePendingSubscriptionPriceId({
        clerkUserId,
        pendingSubscriptionPriceId: planId,
      });

      return { status: 200, body: { url: result.approveUrl ?? `${getRequestOrigin(input.headers)}/billing?switch=scheduled` } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to schedule PayPal plan change.";
      console.error("change-paypal-plan failed:", {
        clerkUserId,
        tier,
        planId,
        message,
      });
      return {
        status: 500,
        body: {
          error:
            process.env.NODE_ENV === "development"
              ? message
              : "Unable to schedule PayPal plan change.",
        },
      };
    }
  };

export const cancelPayPalSubscriptionHandler =
  (deps: PayPalCancelDeps) =>
  async (input: BillingRequestInput): Promise<BillingResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    if (!deps.isPayPalEnabled()) {
      return {
        status: 404,
        body: { error: "PayPal subscriptions are not available right now." },
      };
    }

    const clerkUserId = await deps.getAuthUserId();
    if (!clerkUserId) {
      return { status: 401, body: { error: "Unauthorized" } };
    }

    const user = await deps.findUserByClerkId(clerkUserId);
    if (!user || user.subscriptionProvider !== "paypal" || !user.paypalSubscriptionId) {
      return { status: 404, body: { error: "No PayPal subscription found." } };
    }

    try {
      await deps.cancelPayPalSubscription({
        paypalSubscriptionId: user.paypalSubscriptionId,
        reason: "User requested cancellation.",
      });
      await deps.markPayPalSubscriptionCancelAtPeriodEnd({
        clerkUserId,
      });
      return { status: 200, body: { url: `${getRequestOrigin(input.headers)}/billing` } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to cancel PayPal subscription.";
      console.error("cancel-paypal-subscription failed:", {
        clerkUserId,
        paypalSubscriptionId: user.paypalSubscriptionId,
        message,
      });
      return {
        status: 500,
        body: {
          error:
            process.env.NODE_ENV === "development"
              ? message
              : "Unable to cancel PayPal subscription.",
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
