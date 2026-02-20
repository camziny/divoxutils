import test from "node:test";
import assert from "node:assert/strict";
import { getPlayerPoolEmptyState } from "../src/app/draft/[id]/components/playerPoolState";

test("player pool shows setup empty label when no players in setup", () => {
  const state = getPlayerPoolEmptyState({
    playersCount: 0,
    isSetup: true,
    isDrafting: false,
  });
  assert.deepEqual(state, {
    topNotice: null,
    listEmptyLabel: "No players",
  });
});

test("player pool shows drafting empty notice when no players during draft", () => {
  const state = getPlayerPoolEmptyState({
    playersCount: 0,
    isSetup: false,
    isDrafting: true,
  });
  assert.deepEqual(state, {
    topNotice: "No players remaining",
    listEmptyLabel: null,
  });
});

test("player pool does not show empty messages when draft is complete", () => {
  const state = getPlayerPoolEmptyState({
    playersCount: 0,
    isSetup: false,
    isDrafting: false,
  });
  assert.deepEqual(state, {
    topNotice: null,
    listEmptyLabel: null,
  });
});
