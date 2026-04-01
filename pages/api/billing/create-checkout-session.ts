import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../prisma/prismaClient";
import { getStripeClient, getStripePriceMap } from "@/server/billing/stripe";

type CheckoutDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
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

const parseTier = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (![1, 2, 3].includes(parsed)) return null;
  return parsed;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const getRequestOrigin = (req: NextApiRequest): string => {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (envBaseUrl) return envBaseUrl;
  const host = (req.headers["x-forwarded-host"] ??
    req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
};

export const createCheckoutSessionHandler =
  (deps: CheckoutDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const tier = parseTier(req.body?.tier);
    if (!tier) {
      return res.status(400).json({ error: "tier must be one of 1, 2, or 3." });
    }

    const user = await deps.findUserByClerkId(clerkUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.subscriptionStatus && ACTIVE_STATUSES.has(user.subscriptionStatus)) {
      return res.status(409).json({
        error:
          "You already have an active subscription. Use Billing to switch plans or manage your subscription.",
      });
    }

    const priceMap = deps.getPriceMap();
    const priceId = priceMap[tier];
    if (!priceId) {
      return res.status(500).json({ error: "Subscription pricing is misconfigured." });
    }

    try {
      const session = await deps.createCheckoutSession({
        tier,
        priceId,
        clerkUserId,
        customerId: user.stripeCustomerId,
        origin: getRequestOrigin(req),
      });
      if (!session.url) {
        return res.status(500).json({ error: "Unable to create checkout session." });
      }
      return res.status(200).json({ url: session.url });
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
      return res.status(500).json({
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Unable to create checkout session.",
      });
    }
  };

const handler = createCheckoutSessionHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  getPriceMap: getStripePriceMap,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true, stripeCustomerId: true, subscriptionStatus: true },
    }),
  createCheckoutSession: async ({
    tier,
    priceId,
    clerkUserId,
    customerId,
    origin,
  }) =>
    getStripeClient().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: clerkUserId,
      customer: customerId ?? undefined,
      metadata: {
        clerkUserId,
        tier: String(tier),
      },
      subscription_data: {
        metadata: {
          clerkUserId,
        },
      },
      success_url: `${origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?checkout=cancel`,
    }),
});

export default handler;
