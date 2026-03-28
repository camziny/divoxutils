import test from "node:test";
import assert from "node:assert/strict";
import {
  getWindowedImpressions,
  resolveCadence,
} from "../src/app/components/supportPromptCadence";

test("resolveCadence returns signed-in cadence config", () => {
  const cadence = resolveCadence(true);
  assert.equal(cadence.windowDays, 14);
  assert.equal(cadence.maxImpressions, 4);
  assert.equal(cadence.storageKey, "divoxutils_support_prompt_v1_signed_in");
});

test("resolveCadence returns signed-out cadence config", () => {
  const cadence = resolveCadence(false);
  assert.equal(cadence.windowDays, 1);
  assert.equal(cadence.maxImpressions, 1);
  assert.equal(cadence.storageKey, "divoxutils_support_prompt_v1_signed_out");
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
