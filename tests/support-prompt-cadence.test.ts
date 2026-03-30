import test from "node:test";
import assert from "node:assert/strict";
import {
  getWindowedImpressions,
  resolveCadence,
} from "../src/app/components/supportPromptCadence";

test("resolveCadence returns unified cadence config for signed-in users", () => {
  const cadence = resolveCadence(true);
  assert.equal(cadence.windowDays, 7);
  assert.equal(cadence.maxImpressions, 5);
  assert.equal(cadence.storageKey, "divoxutils_support_prompt_v2_non_supporter_device");
});

test("resolveCadence returns unified cadence config for signed-out users", () => {
  const cadence = resolveCadence(false);
  assert.equal(cadence.windowDays, 7);
  assert.equal(cadence.maxImpressions, 5);
  assert.equal(cadence.storageKey, "divoxutils_support_prompt_v2_non_supporter_device");
});

test("getWindowedImpressions keeps only impressions inside window", () => {
  const now = Date.UTC(2026, 2, 27, 12, 0, 0);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const windowed = getWindowedImpressions(
    [now - oneDayMs * 3, now - oneDayMs, now - 1000, now],
    now,
    oneDayMs * 2
  );
  assert.deepEqual(windowed, [now - oneDayMs, now - 1000, now]);
});

test("getWindowedImpressions includes boundary timestamp", () => {
  const now = Date.UTC(2026, 2, 27, 12, 0, 0);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const threshold = now - oneDayMs * 2;
  const windowed = getWindowedImpressions(
    [threshold - 1, threshold, threshold + 1],
    now,
    oneDayMs * 2
  );
  assert.deepEqual(windowed, [threshold, threshold + 1]);
});
