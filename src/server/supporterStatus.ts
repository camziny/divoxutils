import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

type SupporterStatusInput = {
  supporterTier?: number | null;
  subscriptionStatus?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean | null;
  subscriptionCurrentPeriodEnd?: Date | null;
};

export function isEffectivelySupporter(
  input: SupporterStatusInput | null | undefined,
  now = new Date()
) {
  if (!input) return false;
  const hasTier = (input.supporterTier ?? 0) > 0;
  const hasActiveStatus = isActiveSubscriptionStatus(input.subscriptionStatus);
  const hasGraceAccess =
    Boolean(input.subscriptionCancelAtPeriodEnd) &&
    Boolean(input.subscriptionCurrentPeriodEnd) &&
    (input.subscriptionCurrentPeriodEnd ?? now) > now;
  return hasTier || hasActiveStatus || hasGraceAccess;
}
