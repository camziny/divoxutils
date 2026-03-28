import test from "node:test";
import assert from "node:assert/strict";
import { isEffectivelySupporter } from "../src/server/supporterStatus";

test("isEffectivelySupporter returns true for supporter tier", () => {
  assert.equal(
    isEffectivelySupporter({
      supporterTier: 1,
      subscriptionStatus: null,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    }),
    true
  );
});

test("isEffectivelySupporter returns true for active subscription status", () => {
  assert.equal(
    isEffectivelySupporter({
      supporterTier: 0,
      subscriptionStatus: "active",
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    }),
    true
  );
  assert.equal(
    isEffectivelySupporter({
      supporterTier: 0,
      subscriptionStatus: "trialing",
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    }),
    true
  );
  assert.equal(
    isEffectivelySupporter({
      supporterTier: 0,
      subscriptionStatus: "past_due",
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    }),
    true
  );
});

test("isEffectivelySupporter returns true for grace access window", () => {
  const now = new Date("2026-03-28T12:00:00.000Z");
  assert.equal(
    isEffectivelySupporter(
      {
        supporterTier: 0,
        subscriptionStatus: "canceled",
        subscriptionCancelAtPeriodEnd: true,
        subscriptionCurrentPeriodEnd: new Date("2026-03-29T00:00:00.000Z"),
      },
      now
    ),
    true
  );
});

test("isEffectivelySupporter returns false for expired or inactive states", () => {
  const now = new Date("2026-03-28T12:00:00.000Z");
  assert.equal(
    isEffectivelySupporter(
      {
        supporterTier: 0,
        subscriptionStatus: "canceled",
        subscriptionCancelAtPeriodEnd: true,
        subscriptionCurrentPeriodEnd: new Date("2026-03-28T12:00:00.000Z"),
      },
      now
    ),
    false
  );
  assert.equal(
    isEffectivelySupporter(
      {
        supporterTier: 0,
        subscriptionStatus: "none",
        subscriptionCancelAtPeriodEnd: false,
        subscriptionCurrentPeriodEnd: null,
      },
      now
    ),
    false
  );
  assert.equal(isEffectivelySupporter(null, now), false);
});
