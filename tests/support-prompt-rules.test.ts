import test from "node:test";
import assert from "node:assert/strict";
import {
  isKnownExemptActive,
  shouldClearKnownExempt,
  isSupportPromptEligible,
  isSupportPromptExcludedPath,
} from "../src/app/components/supportPromptRules";

test("isSupportPromptExcludedPath excludes required routes", () => {
  assert.equal(isSupportPromptExcludedPath("/"), true);
  assert.equal(isSupportPromptExcludedPath("/contribute"), true);
  assert.equal(isSupportPromptExcludedPath("/contribute/thanks"), true);
  assert.equal(isSupportPromptExcludedPath("/billing"), true);
  assert.equal(isSupportPromptExcludedPath("/billing/manage"), true);
  assert.equal(isSupportPromptExcludedPath("/draft"), false);
  assert.equal(isSupportPromptExcludedPath("/draft/abc123"), true);
  assert.equal(isSupportPromptExcludedPath("/draft/abc123/extra"), false);
  assert.equal(isSupportPromptExcludedPath("/sign-in"), true);
  assert.equal(isSupportPromptExcludedPath("/sign-up/continue"), true);
  assert.equal(isSupportPromptExcludedPath("/test/support-modal"), true);
  assert.equal(isSupportPromptExcludedPath("/support-modal-test"), false);
  assert.equal(isSupportPromptExcludedPath(null), true);
  assert.equal(isSupportPromptExcludedPath("/user/cameron/characters"), false);
});

test("isSupportPromptEligible blocks non-eligible states", () => {
  assert.equal(
    isSupportPromptEligible({
      isLoaded: false,
      isSupporter: false,
      isAdmin: false,
      isKnownExempt: false,
      ignorePathRules: false,
      pathname: "/user/cameron/characters",
    }),
    false
  );
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: true,
      isAdmin: false,
      isKnownExempt: false,
      ignorePathRules: false,
      pathname: "/user/cameron/characters",
    }),
    false
  );
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: false,
      isAdmin: true,
      isKnownExempt: false,
      ignorePathRules: false,
      pathname: "/user/cameron/characters",
    }),
    false
  );
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: false,
      isAdmin: false,
      isKnownExempt: true,
      ignorePathRules: false,
      pathname: "/user/cameron/characters",
    }),
    false
  );
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: false,
      isAdmin: false,
      isKnownExempt: false,
      ignorePathRules: false,
      pathname: "/contribute",
    }),
    false
  );
});

test("isSupportPromptEligible allows normal path and ignorePathRules override", () => {
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: false,
      isAdmin: false,
      isKnownExempt: false,
      ignorePathRules: false,
      pathname: "/user/cameron/characters",
    }),
    true
  );
  assert.equal(
    isSupportPromptEligible({
      isLoaded: true,
      isSupporter: false,
      isAdmin: false,
      isKnownExempt: false,
      ignorePathRules: true,
      pathname: "/contribute",
    }),
    true
  );
});

test("isKnownExemptActive validates timestamps safely", () => {
  const now = Date.UTC(2026, 2, 28, 0, 0, 0);
  assert.equal(isKnownExemptActive(now + 1, now), true);
  assert.equal(isKnownExemptActive(now, now), false);
  assert.equal(isKnownExemptActive(now - 1, now), false);
  assert.equal(isKnownExemptActive(null, now), false);
  assert.equal(isKnownExemptActive(Number.NaN, now), false);
});

test("shouldClearKnownExempt clears immediately for signed-in non-supporters", () => {
  assert.equal(
    shouldClearKnownExempt({
      isSignedIn: true,
      isSupporter: false,
      isAdmin: false,
    }),
    true
  );
  assert.equal(
    shouldClearKnownExempt({
      isSignedIn: false,
      isSupporter: false,
      isAdmin: false,
    }),
    false
  );
  assert.equal(
    shouldClearKnownExempt({
      isSignedIn: true,
      isSupporter: true,
      isAdmin: false,
    }),
    false
  );
  assert.equal(
    shouldClearKnownExempt({
      isSignedIn: true,
      isSupporter: false,
      isAdmin: true,
    }),
    false
  );
});
