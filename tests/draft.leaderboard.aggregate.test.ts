import test from "node:test";
import assert from "node:assert/strict";
import { aggregateDraftLeaderboardRows } from "../src/server/draftLeaderboard";

test("aggregateDraftLeaderboardRows only counts verified draft results", () => {
  const drafts = [
    {
      shortId: "a1",
      discordGuildId: "g1",
      winnerTeam: 1 as const,
      resultStatus: "verified" as const,
      players: [
        { discordUserId: "d1", displayName: "P1", team: 1 as const, isCaptain: true },
        { discordUserId: "d2", displayName: "P2", team: 2 as const, isCaptain: false },
      ],
    },
    {
      shortId: "a2",
      discordGuildId: "g1",
      winnerTeam: 2 as const,
      resultStatus: "unverified" as const,
      players: [
        { discordUserId: "d1", displayName: "P1", team: 1 as const, isCaptain: false },
        { discordUserId: "d2", displayName: "P2", team: 2 as const, isCaptain: true },
      ],
    },
    {
      shortId: "a3",
      discordGuildId: "g1",
      winnerTeam: 2 as const,
      resultStatus: "voided" as const,
      players: [
        { discordUserId: "d1", displayName: "P1", team: 1 as const, isCaptain: false },
        { discordUserId: "d2", displayName: "P2", team: 2 as const, isCaptain: true },
      ],
    },
  ];

  const clerkByDiscord = new Map<string, string>([
    ["d1", "clerk_1"],
    ["d2", "clerk_2"],
  ]);
  const namesByClerk = new Map<string, string>([
    ["clerk_1", "Alice"],
    ["clerk_2", "Bob"],
  ]);

  const rows = aggregateDraftLeaderboardRows(drafts, clerkByDiscord, namesByClerk);

  assert.equal(rows.length, 2);
  const alice = rows.find((row) => row.clerkUserId === "clerk_1");
  const bob = rows.find((row) => row.clerkUserId === "clerk_2");
  assert.ok(alice);
  assert.ok(bob);
  assert.equal(alice.wins, 1);
  assert.equal(alice.losses, 0);
  assert.equal(alice.captainWins, 1);
  assert.equal(alice.captainLosses, 0);
  assert.equal(bob.wins, 0);
  assert.equal(bob.losses, 1);
  assert.equal(bob.captainWins, 0);
  assert.equal(bob.captainLosses, 0);
});

test("aggregateDraftLeaderboardRows ignores unlinked players and sorts by wins", () => {
  const drafts = [
    {
      shortId: "a1",
      discordGuildId: "g1",
      winnerTeam: 2 as const,
      resultStatus: "verified" as const,
      players: [
        { discordUserId: "d1", displayName: "P1", team: 1 as const, isCaptain: false },
        { discordUserId: "d2", displayName: "P2", team: 2 as const, isCaptain: true },
        { discordUserId: "d3", displayName: "P3", team: 2 as const, isCaptain: false },
      ],
    },
  ];

  const clerkByDiscord = new Map<string, string>([
    ["d1", "clerk_1"],
    ["d2", "clerk_2"],
  ]);
  const namesByClerk = new Map<string, string>([
    ["clerk_1", "Alice"],
    ["clerk_2", "Bob"],
  ]);

  const rows = aggregateDraftLeaderboardRows(drafts, clerkByDiscord, namesByClerk);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].clerkUserId, "clerk_2");
  assert.equal(rows[0].wins, 1);
  assert.equal(rows[0].captainWins, 1);
  assert.equal(rows[1].clerkUserId, "clerk_1");
  assert.equal(rows[1].losses, 1);
});
