import test from "node:test";
import assert from "node:assert/strict";
import {
  appendTrackedCheckoutSessionId,
  hasTrackedCheckoutSessionId,
  isActiveSupportSubscriptionStatus,
  shouldTrackSupportSubscribeSuccess,
} from "../src/app/billing/_lib/supportSubscribeAnalytics";

test("isActiveSupportSubscriptionStatus matches active support states", () => {
  assert.equal(isActiveSupportSubscriptionStatus("active"), true);
  assert.equal(isActiveSupportSubscriptionStatus("trialing"), true);
  assert.equal(isActiveSupportSubscriptionStatus("past_due"), true);
  assert.equal(isActiveSupportSubscriptionStatus("canceled"), false);
  assert.equal(isActiveSupportSubscriptionStatus(null), false);
});

test("shouldTrackSupportSubscribeSuccess requires success and active status", () => {
  assert.equal(
    shouldTrackSupportSubscribeSuccess({
      checkoutStatus: "success",
      subscriptionStatus: "active",
    }),
    true
  );
  assert.equal(
    shouldTrackSupportSubscribeSuccess({
      checkoutStatus: "success",
      subscriptionStatus: "canceled",
    }),
    false
  );
  assert.equal(
    shouldTrackSupportSubscribeSuccess({
      checkoutStatus: "cancel",
      subscriptionStatus: "active",
    }),
    false
  );
});

test("hasTrackedCheckoutSessionId handles missing and present values", () => {
  assert.equal(hasTrackedCheckoutSessionId(null, ["cs_1"]), false);
  assert.equal(hasTrackedCheckoutSessionId("cs_2", ["cs_1"]), false);
  assert.equal(hasTrackedCheckoutSessionId("cs_1", ["cs_1"]), true);
});

test("appendTrackedCheckoutSessionId dedupes and keeps the latest 50", () => {
  const initial = Array.from({ length: 50 }, (_, i) => `cs_${i + 1}`);
  const deduped = appendTrackedCheckoutSessionId(initial, "cs_50");
  assert.equal(deduped.length, 50);
  assert.equal(deduped[49], "cs_50");

  const appended = appendTrackedCheckoutSessionId(initial, "cs_51");
  assert.equal(appended.length, 50);
  assert.equal(appended[0], "cs_2");
  assert.equal(appended[49], "cs_51");
});
