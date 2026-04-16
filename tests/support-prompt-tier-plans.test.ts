import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_PROMPT_TIER_PLANS } from "../src/components/support/supportPromptTierPlans";

test("support prompt tier plans include all expected tiers in order", () => {
  assert.deepEqual(
    SUPPORT_PROMPT_TIER_PLANS.map((plan) => plan.tier),
    [1, 2, 3]
  );
});

test("support prompt tier plans expose non-empty labels and descriptions", () => {
  for (const plan of SUPPORT_PROMPT_TIER_PLANS) {
    assert.equal(typeof plan.label, "string");
    assert.ok(plan.label.length > 0);
    assert.equal(typeof plan.description, "string");
    assert.ok(plan.description.length > 0);
  }
});
