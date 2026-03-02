import test from "node:test";
import assert from "node:assert/strict";
import { getNormalizedFightIndex } from "../src/app/draft-history/DraftHistoryClient";

test("getNormalizedFightIndex defaults to first fight when no selected index", () => {
  assert.equal(getNormalizedFightIndex(5), 0);
});

test("getNormalizedFightIndex clamps out-of-range indices", () => {
  assert.equal(getNormalizedFightIndex(3, -4), 0);
  assert.equal(getNormalizedFightIndex(3, 99), 2);
});

test("getNormalizedFightIndex handles empty fights safely", () => {
  assert.equal(getNormalizedFightIndex(0, 2), 0);
  assert.equal(getNormalizedFightIndex(0), 0);
});
