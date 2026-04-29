const STORAGE_KEY = "divoxutils_support_prompt_v2_non_supporter_device";
const WINDOW_DAYS = 7;
const MAX_IMPRESSIONS = 6;
const MIN_INTERVAL_HOURS = 20;

export function resolveCadence(_isSignedIn: boolean) {
  const windowDays = WINDOW_DAYS;
  const maxImpressions = MAX_IMPRESSIONS;
  const minIntervalMs = MIN_INTERVAL_HOURS * 60 * 60 * 1000;
  return {
    windowDays,
    windowMs: windowDays * 24 * 60 * 60 * 1000,
    maxImpressions,
    minIntervalMs,
    storageKey: STORAGE_KEY,
  };
}

export function getWindowedImpressions(
  impressions: number[],
  now: number,
  windowMs: number
) {
  const threshold = now - windowMs;
  return impressions.filter((timestamp) => timestamp >= threshold);
}
