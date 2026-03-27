import Stripe from "stripe";

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getStripeSecretKey = (): string => requiredEnv("STRIPE_SECRET_KEY");

export const getStripeWebhookSecret = (): string =>
  requiredEnv("STRIPE_WEBHOOK_SECRET");

export const getStripePriceMap = (): Record<number, string> => ({
  1: requiredEnv("STRIPE_PRICE_ID_TIER_1"),
  2: requiredEnv("STRIPE_PRICE_ID_TIER_2"),
  3: requiredEnv("STRIPE_PRICE_ID_TIER_3"),
});

let stripeSingleton: Stripe | null = null;

export const getStripeClient = (): Stripe => {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeSingleton;
};

export const getTierFromPriceId = (
  priceId: string | null | undefined,
  priceMap: Record<number, string>
): number => {
  if (!priceId) return 0;
  const match = Object.entries(priceMap).find(([, id]) => id === priceId);
  if (!match) return 0;
  return Number(match[0]);
};

export const shouldGrantSupporterBadge = (
  subscriptionStatus: Stripe.Subscription.Status | string | null | undefined
): boolean => {
  if (!subscriptionStatus) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(
    subscriptionStatus as Stripe.Subscription.Status
  );
};

export const extractRecurringPriceId = (
  subscription: Stripe.Subscription
): string | null => {
  const [firstItem] = subscription.items.data;
  return firstItem?.price?.id ?? null;
};
