const STORAGE_KEY_BASE = "divoxutils_support_prompt_v1";
const SIGNED_IN_WINDOW_DAYS = 14;
const SIGNED_OUT_WINDOW_DAYS = 1;
const SIGNED_IN_MAX_IMPRESSIONS = 4;
const SIGNED_OUT_MAX_IMPRESSIONS = 1;

export function resolveCadence(isSignedIn: boolean) {
  const windowDays = isSignedIn ? SIGNED_IN_WINDOW_DAYS : SIGNED_OUT_WINDOW_DAYS;
  const maxImpressions = isSignedIn ? SIGNED_IN_MAX_IMPRESSIONS : SIGNED_OUT_MAX_IMPRESSIONS;
  return {
    windowDays,
    windowMs: windowDays * 24 * 60 * 60 * 1000,
    maxImpressions,
    storageKey: `${STORAGE_KEY_BASE}_${isSignedIn ? "signed_in" : "signed_out"}`,
  };
}

export function getWindowedImpressions(impressions: number[], now: number, windowMs: number) {
  const threshold = now - windowMs;
  return impressions.filter((timestamp) => timestamp >= threshold);
}
