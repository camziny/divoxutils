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
  const hasActiveStatus =
    input.subscriptionStatus === "active" ||
    input.subscriptionStatus === "trialing" ||
    input.subscriptionStatus === "past_due";
  const hasGraceAccess =
    Boolean(input.subscriptionCancelAtPeriodEnd) &&
    Boolean(input.subscriptionCurrentPeriodEnd) &&
    (input.subscriptionCurrentPeriodEnd ?? now) > now;
  return hasTier || hasActiveStatus || hasGraceAccess;
}
