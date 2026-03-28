export const CONTRIBUTE_NUDGE_STORAGE_KEY = "divoxutils_contribute_nudge_ack_day_v1";

export function getLocalDayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isContributePath(pathname: string | null | undefined) {
  if (!pathname) return false;
  return pathname === "/contribute" || pathname.startsWith("/contribute/");
}

export function shouldShowContributeNudge({
  pathname,
  isSubscribed,
  lastAcknowledgedDay,
  today,
}: {
  pathname: string | null | undefined;
  isSubscribed: boolean;
  lastAcknowledgedDay: string | null;
  today: string;
}) {
  if (isSubscribed) return false;
  if (isContributePath(pathname)) return false;
  return lastAcknowledgedDay !== today;
}
