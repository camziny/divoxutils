import test from "node:test";
import assert from "node:assert/strict";
import {
  getMaxSelectableTeamSize,
  isTeamSizeSelectable,
  toUserSettingsError,
} from "../src/app/draft/[id]/components/settingsUtils";

test("getMaxSelectableTeamSize computes max based on players", () => {
  assert.equal(getMaxSelectableTeamSize(7), 3);
  assert.equal(getMaxSelectableTeamSize(10), 5);
  assert.equal(getMaxSelectableTeamSize(16), 8);
});

test("isTeamSizeSelectable disables oversized values", () => {
  assert.equal(isTeamSizeSelectable(6, 10), false);
  assert.equal(isTeamSizeSelectable(5, 10), true);
});

test("toUserSettingsError normalizes convex need-at-least message", () => {
  const msg = toUserSettingsError(
    new Error(
      "[CONVEX M(drafts:updateSettings)] Server Error Uncaught Error: Need at least 12 players for 6v6 at handler"
    )
  );
  assert.equal(msg, "Need at least 12 players for 6v6. Reduce team size or add players.");
});

test("toUserSettingsError keeps plain errors and fallback", () => {
  assert.equal(toUserSettingsError(new Error("Team size must be between 2 and 8")), "Team size must be between 2 and 8");
  assert.equal(toUserSettingsError({}), "Unable to update draft settings.");
});
