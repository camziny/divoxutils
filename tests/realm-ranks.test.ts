import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateProgressPercentage,
  getNextRealmRank,
  getRealmRankForPoints,
  getRealmRankThreshold,
  getRealmRanks,
  MAX_REALM_RANK,
  OFFICIAL_REALM_RANK_MAX,
} from "../src/utils/character";

test("realm rank thresholds include new official 14L1-15L0 values", () => {
  const realmRanks = getRealmRanks();

  assert.equal(realmRanks.get(141), 223084000);
  assert.equal(realmRanks.get(145), 555928241);
  assert.equal(realmRanks.get(150), 1650444126);
  assert.equal(OFFICIAL_REALM_RANK_MAX, 150);
});

test("realm rank thresholds stop at official 15L0", () => {
  const realmRanks = getRealmRanks();

  assert.equal(realmRanks.get(151), undefined);
  assert.equal(realmRanks.get(160), undefined);
  assert.equal(MAX_REALM_RANK, 150);
});

test("realm rank lookups handle the new cap and max-rank progress safely", () => {
  assert.equal(getRealmRankForPoints(1650444126), 150);
  assert.equal(getRealmRankForPoints(2000000000), 150);
  assert.equal(getNextRealmRank(MAX_REALM_RANK), null);
  assert.equal(calculateProgressPercentage(2000000000, getRealmRankThreshold(151)), 0);
});
