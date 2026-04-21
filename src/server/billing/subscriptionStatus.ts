export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export const isActiveSubscriptionStatus = (
  subscriptionStatus: string | null | undefined
): boolean => {
  if (!subscriptionStatus) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
};
