import test from "node:test";
import assert from "node:assert/strict";
import {
  filterDraftRowsByDiscordServer,
  formatAutoBanSummary,
  getDraftHistoryBanSections,
  getDraftHistoryUrl,
  getDraftHistoryFilterUrl,
  getDiscordServerFilterOptions,
  getNormalizedFightIndex,
  parseDraftHistoryPage,
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
    "/draft-history?server=g2"
  );
  assert.equal(
    getDraftHistoryFilterUrl("/draft-history", "page=2&server=g2", "all"),
    "/draft-history"
  );
});

test("parseDraftHistoryPage normalizes invalid values", () => {
  assert.equal(parseDraftHistoryPage(null), 1);
  assert.equal(parseDraftHistoryPage(""), 1);
  assert.equal(parseDraftHistoryPage("abc"), 1);
  assert.equal(parseDraftHistoryPage("0"), 1);
  assert.equal(parseDraftHistoryPage("-2"), 1);
  assert.equal(parseDraftHistoryPage("3"), 3);
});

test("getDraftHistoryUrl includes page only when greater than 1", () => {
  assert.equal(
    getDraftHistoryUrl("/draft-history", "", "all", 1),
    "/draft-history"
  );
  assert.equal(
    getDraftHistoryUrl("/draft-history", "", "g1", 1),
    "/draft-history?server=g1"
  );
  assert.equal(
    getDraftHistoryUrl("/draft-history", "", "all", 3),
    "/draft-history?page=3"
  );
  assert.equal(
    getDraftHistoryUrl("/draft-history", "foo=bar", "g2", 4),
    "/draft-history?foo=bar&server=g2&page=4"
  );
});

test("getDraftHistoryBanSections separates auto-bans from team bans", () => {
  const bans = [
    { team: 1, className: "Cleric", source: "captain" },
    { team: 2, className: "Bard", source: "captain" },
    { team: 1, className: "Paladin", source: "auto" },
  ] as any;

  const sections = getDraftHistoryBanSections(bans);
  assert.deepEqual(
    sections.team1.map((ban: any) => ban.className),
    ["Cleric"]
  );
  assert.deepEqual(
    sections.team2.map((ban: any) => ban.className),
    ["Bard"]
  );
  assert.deepEqual(
    sections.auto.map((ban: any) => ban.className),
    ["Paladin"]
  );
});

test("getDraftHistoryBanSections treats legacy source-less bans as team bans", () => {
  const bans = [
    { team: 1, className: "Cleric" },
    { team: 2, className: "Bard" },
  ] as any;

  const sections = getDraftHistoryBanSections(bans);
  assert.deepEqual(
    sections.team1.map((ban: any) => ban.className),
    ["Cleric"]
  );
  assert.deepEqual(
    sections.team2.map((ban: any) => ban.className),
    ["Bard"]
  );
  assert.deepEqual(sections.auto, []);
});

test("formatAutoBanSummary stays concise for many auto bans", () => {
  assert.equal(formatAutoBanSummary([]), null);
  assert.equal(
    formatAutoBanSummary(["Cleric", "Bard", "Paladin"]),
    "Cleric, Bard, Paladin"
  );
  assert.equal(
    formatAutoBanSummary(["Cleric", "Bard", "Paladin", "Skald", "Druid"]),
    "Cleric, Bard, Paladin +2"
  );
});
