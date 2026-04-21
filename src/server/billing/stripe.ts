import Stripe from "stripe";
import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

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
  return isActiveSubscriptionStatus(subscriptionStatus);
};

export const extractRecurringPriceId = (
  subscription: Stripe.Subscription
): string | null => {
  const [firstItem] = subscription.items.data;
  return firstItem?.price?.id ?? null;
};
