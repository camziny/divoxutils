import test from "node:test";
import assert from "node:assert/strict";
import {
  filterDraftRowsByDiscordServer,
  getDraftHistoryFilterUrl,
  getDiscordServerFilterOptions,
  getNormalizedFightIndex,
} from "../src/app/draft-history/DraftHistoryClient";

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

test("getDiscordServerFilterOptions builds deduped sorted options", () => {
  const rows = [
    {
      shortId: "a",
      discordGuildId: "g2",
      discordGuildName: "Beta",
    },
    {
      shortId: "b",
      discordGuildId: "g1",
      discordGuildName: "Alpha",
    },
    {
      shortId: "c",
      discordGuildId: "g1",
      discordGuildName: "Alpha Updated",
    },
    {
      shortId: "d",
      discordGuildId: "g3",
      discordGuildName: "",
    },
  ] as any[];

  const options = getDiscordServerFilterOptions(rows as any);
  assert.deepEqual(options, [
    { id: "g1", name: "Alpha" },
    { id: "g2", name: "Beta" },
    { id: "g3", name: "g3" },
  ]);
});

test("filterDraftRowsByDiscordServer filters by selected guild", () => {
  const rows = [
    { shortId: "a", discordGuildId: "g1" },
    { shortId: "b", discordGuildId: "g2" },
    { shortId: "c", discordGuildId: "g1" },
  ] as any[];

  const filtered = filterDraftRowsByDiscordServer(rows as any, "g1");
  assert.deepEqual(
    filtered.map((row: any) => row.shortId),
    ["a", "c"]
  );

  const unfiltered = filterDraftRowsByDiscordServer(rows as any, "all");
  assert.deepEqual(
    unfiltered.map((row: any) => row.shortId),
    ["a", "b", "c"]
  );
});

test("getDraftHistoryFilterUrl sets and clears server query param", () => {
  assert.equal(
    getDraftHistoryFilterUrl("/draft-history", "", "g1"),
    "/draft-history?server=g1"
  );
  assert.equal(
    getDraftHistoryFilterUrl("/draft-history", "page=2", "g2"),
    "/draft-history?page=2&server=g2"
  );
  assert.equal(
    getDraftHistoryFilterUrl("/draft-history", "page=2&server=g2", "all"),
    "/draft-history?page=2"
  );
});
