import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateCaptainRows,
  aggregateHeadToHeadRow,
  aggregateOverallRows,
  aggregatePlayerDrilldown,
} from "../src/server/draftStats";
import { DraftLeaderboardDraft } from "../src/server/draftLeaderboard";

const clerkByDiscord = new Map<string, string>([
  ["d1", "clerk_1"],
  ["d2", "clerk_2"],
  ["d3", "clerk_3"],
]);

const namesByClerk = new Map<string, string>([
  ["clerk_1", "Alice"],
  ["clerk_2", "Bob"],
  ["clerk_3", "Cara"],
]);

const drafts: DraftLeaderboardDraft[] = [
  {
    shortId: "a1",
    discordGuildId: "g1",
    _creationTime: 1_000,
    winnerTeam: 1,
    resultStatus: "verified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: true },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: true },
      { discordUserId: "d3", displayName: "Cara", team: 1, isCaptain: false },
    ],
  },
  {
    shortId: "a2",
    discordGuildId: "g2",
    _creationTime: 2_000,
    winnerTeam: 2,
    resultStatus: "verified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      { discordUserId: "d3", displayName: "Cara", team: 2, isCaptain: true },
    ],
  },
  {
    shortId: "a3",
    discordGuildId: "g1",
    _creationTime: 3_000,
    winnerTeam: 2,
    resultStatus: "unverified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  },
  {
    shortId: "a4",
    discordGuildId: "g1",
    _creationTime: 4_000,
    winnerTeam: 2,
    resultStatus: "voided",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  },
  {
    shortId: "a5",
    discordGuildId: "g1",
    _creationTime: 5_000,
    winnerTeam: 2,
    resultStatus: "verified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 1, isCaptain: false },
      { discordUserId: "d3", displayName: "Cara", team: 2, isCaptain: false },
    ],
  },
];

test("aggregateOverallRows applies guild/date filters and excludes non-verified drafts", () => {
  const rows = aggregateOverallRows(drafts, clerkByDiscord, namesByClerk, {
    guildId: "g1",
    startTimeMs: 900,
    endTimeMs: 1500,
  });

  assert.equal(rows.length, 3);
  const alice = rows.find((row) => row.clerkUserId === "clerk_1");
  const bob = rows.find((row) => row.clerkUserId === "clerk_2");
  const cara = rows.find((row) => row.clerkUserId === "clerk_3");
  assert.ok(alice);
  assert.ok(bob);
  assert.ok(cara);
  assert.equal(alice.wins, 1);
  assert.equal(alice.losses, 0);
  assert.equal(bob.wins, 0);
  assert.equal(bob.losses, 1);
  assert.equal(cara.wins, 1);
  assert.equal(cara.losses, 0);
});

test("aggregateOverallRows respects minGames", () => {
  const rows = aggregateOverallRows(drafts, clerkByDiscord, namesByClerk, {
    minGames: 4,
  });

  assert.equal(rows.length, 0);
});

test("aggregateCaptainRows computes captain-only split and min games", () => {
  const overallRows = aggregateOverallRows(drafts, clerkByDiscord, namesByClerk, {});
  const captainRows = aggregateCaptainRows(overallRows, 1);

  assert.equal(captainRows.length, 3);
  const aliceCaptain = captainRows.find((row) => row.clerkUserId === "clerk_1");
  const bobCaptain = captainRows.find((row) => row.clerkUserId === "clerk_2");
  const caraCaptain = captainRows.find((row) => row.clerkUserId === "clerk_3");
  assert.ok(aliceCaptain);
  assert.ok(bobCaptain);
  assert.ok(caraCaptain);
  assert.equal(aliceCaptain.wins, 1);
  assert.equal(aliceCaptain.losses, 0);
  assert.equal(bobCaptain.wins, 0);
  assert.equal(bobCaptain.losses, 1);
  assert.equal(caraCaptain.wins, 1);
  assert.equal(caraCaptain.losses, 0);
});

test("aggregateHeadToHeadRow returns accurate vs math and ignores same-team drafts", () => {
  const row = aggregateHeadToHeadRow(
    drafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    "clerk_2",
    {}
  );
  assert.ok(row);
  assert.equal(row.playerClerkUserId, "clerk_1");
  assert.equal(row.opponentClerkUserId, "clerk_2");
  assert.equal(row.wins, 1);
  assert.equal(row.losses, 1);
  assert.equal(row.games, 2);
  assert.equal(row.winRate, 50);
});

test("aggregatePlayerDrilldown returns recent verified drafts and captain split", () => {
  const drilldown = aggregatePlayerDrilldown(
    drafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.playerClerkUserId, "clerk_1");
  assert.equal(drilldown.overall.wins, 1);
  assert.equal(drilldown.overall.losses, 2);
  assert.equal(drilldown.captain.wins, 1);
  assert.equal(drilldown.captain.losses, 0);
  assert.equal(drilldown.recentGames.length, 3);
  assert.equal(drilldown.recentGames[0].shortId, "a5");
  assert.equal(drilldown.recentGames[0].team1CaptainName, "Unknown");
  assert.equal(drilldown.recentGames[0].team2CaptainName, "Unknown");
  assert.equal(drilldown.recentGames[2].team1CaptainName, "Alice");
  assert.equal(drilldown.recentGames[2].team2CaptainName, "Bob");
  assert.equal(drilldown.headToHead.length, 2);
});

test("aggregatePlayerDrilldown returns null when filters eliminate qualifying games", () => {
  const drilldown = aggregatePlayerDrilldown(
    drafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    { guildId: "g2", minGames: 2 }
  );
  assert.equal(drilldown, null);
});
