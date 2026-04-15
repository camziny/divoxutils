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

test("legacy app component paths point to shared components", () => {
  const appSupporterBadgeSource = readFileSync("src/app/components/SupporterBadge.tsx", "utf8");
  const appSignedOutNudgeSource = readFileSync("src/app/components/SignedOutNudge.tsx", "utf8");
  const appHoverPrefetchLinkSource = readFileSync(
    "src/app/components/HoverPrefetchLink.tsx",
    "utf8"
  );
  const appViewportPrefetchLinkSource = readFileSync(
    "src/app/components/ViewportPrefetchLink.tsx",
    "utf8"
  );

  assert.equal(
    appSupporterBadgeSource.includes('from "@/components/support/SupporterBadge"'),
    true
  );
  assert.equal(
    appSignedOutNudgeSource.includes('from "@/components/auth/SignedOutNudge"'),
    true
  );
  assert.equal(
    appHoverPrefetchLinkSource.includes('from "@/components/navigation/HoverPrefetchLink"'),
    true
  );
  assert.equal(
    appViewportPrefetchLinkSource.includes('from "@/components/navigation/ViewportPrefetchLink"'),
    true
  );
});

test("legacy duplicate route component folders are removed", () => {
  assert.equal(existsSync("src/app/leaderboards/components"), false);
  assert.equal(existsSync("src/app/search/components"), false);
});
