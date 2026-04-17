export const TRACKED_CHECKOUT_SESSION_IDS_KEY = "divoxutils_tracked_checkout_session_ids_v1";

export function isActiveSupportSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

export function shouldTrackSupportSubscribeSuccess(params: {
  checkoutStatus: "success" | "cancel" | null;
  subscriptionStatus: string | null | undefined;
}): boolean {
  if (params.checkoutStatus !== "success") return false;
  return isActiveSupportSubscriptionStatus(params.subscriptionStatus);
}

export function hasTrackedCheckoutSessionId(
  checkoutSessionId: string | null | undefined,
  trackedSessionIds: string[]
): boolean {
  if (!checkoutSessionId) return false;
  return trackedSessionIds.includes(checkoutSessionId);
}

export function appendTrackedCheckoutSessionId(
  trackedSessionIds: string[],
  checkoutSessionId: string | null | undefined
): string[] {
  if (!checkoutSessionId) return trackedSessionIds;
  if (trackedSessionIds.includes(checkoutSessionId)) return trackedSessionIds;
  return [...trackedSessionIds, checkoutSessionId].slice(-50);
}
