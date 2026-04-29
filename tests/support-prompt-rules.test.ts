import test from "node:test";
import assert from "node:assert/strict";
import {
  isSupportPromptEligible,
  isSupportPromptExcludedPath,
} from "../src/components/support/supportPromptRules";

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
      hasSupporterDeviceGrace: false,
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
      hasSupporterDeviceGrace: false,
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
      hasSupporterDeviceGrace: false,
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
      hasSupporterDeviceGrace: true,
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
      hasSupporterDeviceGrace: false,
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
      hasSupporterDeviceGrace: false,
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
      hasSupporterDeviceGrace: false,
      ignorePathRules: true,
      pathname: "/contribute",
    }),
    true
  );
});
