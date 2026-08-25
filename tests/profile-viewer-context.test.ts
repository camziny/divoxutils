import test from "node:test";
import assert from "node:assert/strict";
import { isProfileHiddenForViewer } from "../src/server/profileViewerContext";

test("isProfileHiddenForViewer hides a hidden profile from a stranger", () => {
  assert.equal(
    isProfileHiddenForViewer(true, { canViewHiddenProfile: false }),
    true
  );
});

test("isProfileHiddenForViewer shows a hidden profile to its owner", () => {
  assert.equal(
    isProfileHiddenForViewer(true, { canViewHiddenProfile: true }),
    false
  );
});

test("isProfileHiddenForViewer shows a hidden profile to an admin", () => {
  assert.equal(
    isProfileHiddenForViewer(true, { canViewHiddenProfile: true }),
    false
  );
});

test("isProfileHiddenForViewer never hides a visible profile", () => {
  assert.equal(
    isProfileHiddenForViewer(false, { canViewHiddenProfile: false }),
    false
  );
  assert.equal(
    isProfileHiddenForViewer(false, { canViewHiddenProfile: true }),
    false
  );
});
