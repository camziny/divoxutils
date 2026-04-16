import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

test("unused legacy user context is removed", () => {
  assert.equal(existsSync("src/contexts/UserContext.tsx"), false);
  assert.equal(existsSync("src/app/user/_components/CharacterListOptimized.tsx"), false);
});

test("shared components are not sourced from app components", () => {
  const supporterBadgeSource = readFileSync("src/components/support/SupporterBadge.tsx", "utf8");
  const signedOutNudgeSource = readFileSync("src/components/auth/SignedOutNudge.tsx", "utf8");

  assert.equal(supporterBadgeSource.includes("@/app/components/"), false);
  assert.equal(signedOutNudgeSource.includes("@/app/components/"), false);
});

test("legacy app component wrappers are removed", () => {
  assert.equal(existsSync("src/app/components/SupporterBadge.tsx"), false);
  assert.equal(existsSync("src/app/components/SignedOutNudge.tsx"), false);
  assert.equal(existsSync("src/app/components/HoverPrefetchLink.tsx"), false);
  assert.equal(existsSync("src/app/components/ViewportPrefetchLink.tsx"), false);
  assert.equal(existsSync("src/app/components/supportPromptCadence.ts"), false);
  assert.equal(existsSync("src/app/components/supportPromptRules.ts"), false);
  assert.equal(existsSync("src/app/components/supportPromptTierPlans.ts"), false);
});

test("legacy duplicate route component folders are removed", () => {
  assert.equal(existsSync("src/app/leaderboards/components"), false);
  assert.equal(existsSync("src/app/search/components"), false);
});
