import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateCaptainRows,
  aggregateClassRows,
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
    type: "traditional",
    discordGuildId: "g1",
    _creationTime: 1_000,
    winnerTeam: 1,
    resultStatus: "verified",
    team1Realm: "Albion",
    team2Realm: "Midgard",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: true },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: true },
      { discordUserId: "d3", displayName: "Cara", team: 1, isCaptain: false },
    ],
  },
  {
    shortId: "a2",
    type: "traditional",
    discordGuildId: "g2",
    _creationTime: 2_000,
    winnerTeam: 2,
    resultStatus: "verified",
    team1Realm: "Hibernia",
    team2Realm: "Albion",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      { discordUserId: "d3", displayName: "Cara", team: 2, isCaptain: true },
    ],
  },
  {
    shortId: "a3",
    type: "traditional",
    discordGuildId: "g1",
    _creationTime: 3_000,
    winnerTeam: 2,
    resultStatus: "unverified",
    team1Realm: "Albion",
    team2Realm: "Hibernia",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  },
  {
    shortId: "a4",
    type: "traditional",
    discordGuildId: "g1",
    _creationTime: 4_000,
    winnerTeam: 2,
    resultStatus: "voided",
    team1Realm: "Midgard",
    team2Realm: "Hibernia",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  },
  {
    shortId: "a5",
    type: "traditional",
    discordGuildId: "g1",
    _creationTime: 5_000,
    winnerTeam: 2,
    resultStatus: "verified",
    team1Realm: "Midgard",
    team2Realm: "Albion",
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

test("aggregateOverallRows includes latest avatar from verified drafts", () => {
  const avatarDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "old-avatar",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        {
          discordUserId: "d1",
          displayName: "Alice",
          avatarUrl: "https://cdn.example.com/alice-old.png",
          team: 1,
          isCaptain: false,
        },
      ],
    },
    {
      shortId: "new-avatar",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 2_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        {
          discordUserId: "d1",
          displayName: "Alice",
          avatarUrl: "https://cdn.example.com/alice-new.png",
          team: 1,
          isCaptain: false,
        },
      ],
    },
  ];

  const rows = aggregateOverallRows(
    avatarDrafts,
    clerkByDiscord,
    namesByClerk,
    {}
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].avatarUrl, "https://cdn.example.com/alice-new.png");
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
  assert.equal(drilldown.headToHeadCaptain.length, 1);
  assert.equal(drilldown.headToHeadCaptain[0].opponentClerkUserId, "clerk_2");
  assert.equal(drilldown.headToHeadCaptain[0].wins, 1);
  assert.equal(drilldown.headToHeadCaptain[0].losses, 0);
  assert.equal(drilldown.teammateRecords.length, 2);
  const withCara = drilldown.teammateRecords.find(
    (row) => row.teammateClerkUserId === "clerk_3"
  );
  const withBob = drilldown.teammateRecords.find(
    (row) => row.teammateClerkUserId === "clerk_2"
  );
  assert.ok(withCara);
  assert.equal(withCara.wins, 1);
  assert.equal(withCara.losses, 0);
  assert.equal(withCara.winRate, 100);
  assert.equal(withCara.lossRate, 0);
  assert.ok(withBob);
  assert.equal(withBob.wins, 0);
  assert.equal(withBob.losses, 1);
  assert.equal(withBob.winRate, 0);
  assert.equal(withBob.lossRate, 100);
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

test("aggregatePlayerDrilldown computes per-realm breakdown for traditional drafts", () => {
  const drilldown = aggregatePlayerDrilldown(
    drafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.ok(drilldown.byRealm.Albion);
  assert.equal(drilldown.byRealm.Albion.wins, 1);
  assert.equal(drilldown.byRealm.Albion.losses, 0);
  assert.equal(drilldown.byRealm.Albion.games, 1);
  assert.equal(drilldown.byRealm.Albion.winRate, 100);

  assert.ok(drilldown.byRealm.Hibernia);
  assert.equal(drilldown.byRealm.Hibernia.wins, 0);
  assert.equal(drilldown.byRealm.Hibernia.losses, 1);
  assert.equal(drilldown.byRealm.Hibernia.games, 1);
  assert.equal(drilldown.byRealm.Hibernia.winRate, 0);

  assert.ok(drilldown.byRealm.Midgard);
  assert.equal(drilldown.byRealm.Midgard.wins, 0);
  assert.equal(drilldown.byRealm.Midgard.losses, 1);
  assert.equal(drilldown.byRealm.Midgard.games, 1);
  assert.equal(drilldown.byRealm.Midgard.winRate, 0);

  assert.equal(drilldown.pvp.games, 0);
});

test("aggregatePlayerDrilldown computes pvp breakdown separately from realm stats", () => {
  const pvpDraft: DraftLeaderboardDraft = {
    shortId: "pvp1",
    type: "pvp",
    discordGuildId: "g1",
    _creationTime: 6_000,
    winnerTeam: 1,
    resultStatus: "verified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  };

  const pvpDraft2: DraftLeaderboardDraft = {
    shortId: "pvp2",
    type: "pvp",
    discordGuildId: "g1",
    _creationTime: 7_000,
    winnerTeam: 2,
    resultStatus: "verified",
    players: [
      { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
      { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
    ],
  };

  const allDrafts = [...drafts, pvpDraft, pvpDraft2];
  const drilldown = aggregatePlayerDrilldown(
    allDrafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.pvp.wins, 1);
  assert.equal(drilldown.pvp.losses, 1);
  assert.equal(drilldown.pvp.games, 2);
  assert.equal(drilldown.pvp.winRate, 50);

  assert.equal(drilldown.overall.games, 5);
  assert.equal(drilldown.overall.wins, 2);
  assert.equal(drilldown.overall.losses, 3);

  assert.equal(drilldown.byRealm.Albion.games, 1);
  assert.equal(drilldown.byRealm.Hibernia.games, 1);
  assert.equal(drilldown.byRealm.Midgard.games, 1);
});

test("aggregatePlayerDrilldown does not create realm entry for pvp drafts", () => {
  const pvpOnly: DraftLeaderboardDraft[] = [
    {
      shortId: "pvp-only1",
      type: "pvp",
      discordGuildId: "g1",
      _creationTime: 10_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    pvpOnly,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.deepEqual(drilldown.byRealm, {});
  assert.equal(drilldown.pvp.wins, 1);
  assert.equal(drilldown.pvp.losses, 0);
  assert.equal(drilldown.pvp.games, 1);
});

test("aggregatePlayerDrilldown includes draftType and playerRealm in recent games", () => {
  const mixedDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "trad1",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      team1Realm: "Albion",
      team2Realm: "Midgard",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
    {
      shortId: "pvp3",
      type: "pvp",
      discordGuildId: "g1",
      _creationTime: 2_000,
      winnerTeam: 2,
      resultStatus: "verified",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    mixedDrafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.recentGames.length, 2);

  const pvpGame = drilldown.recentGames.find((g) => g.shortId === "pvp3");
  assert.ok(pvpGame);
  assert.equal(pvpGame.draftType, "pvp");
  assert.equal(pvpGame.playerRealm, undefined);

  const tradGame = drilldown.recentGames.find((g) => g.shortId === "trad1");
  assert.ok(tradGame);
  assert.equal(tradGame.draftType, "traditional");
  assert.equal(tradGame.playerRealm, "Albion");
});

test("aggregatePlayerDrilldown assigns correct realm for team 2 player", () => {
  const d: DraftLeaderboardDraft[] = [
    {
      shortId: "t2-realm",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 2,
      resultStatus: "verified",
      team1Realm: "Albion",
      team2Realm: "Midgard",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 2, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 1, isCaptain: false },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    d,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.byRealm.Midgard?.wins, 1);
  assert.equal(drilldown.byRealm.Midgard?.games, 1);
  assert.equal(drilldown.byRealm.Albion, undefined);
  assert.equal(drilldown.recentGames[0].playerRealm, "Midgard");
});

test("aggregatePlayerDrilldown overall totals include both realm and pvp games", () => {
  const mixed: DraftLeaderboardDraft[] = [
    {
      shortId: "m1",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      team1Realm: "Albion",
      team2Realm: "Hibernia",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
    {
      shortId: "m2",
      type: "pvp",
      discordGuildId: "g1",
      _creationTime: 2_000,
      winnerTeam: 2,
      resultStatus: "verified",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: true },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
    {
      shortId: "m3",
      type: "pvp",
      discordGuildId: "g1",
      _creationTime: 3_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    mixed,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.overall.games, 3);
  assert.equal(drilldown.overall.wins, 2);
  assert.equal(drilldown.overall.losses, 1);
  assert.equal(drilldown.pvp.games, 2);
  assert.equal(drilldown.pvp.wins, 1);
  assert.equal(drilldown.pvp.losses, 1);
  assert.equal(drilldown.byRealm.Albion?.games, 1);
  assert.equal(drilldown.byRealm.Albion?.wins, 1);
  assert.equal(drilldown.captain.games, 1);
  assert.equal(drilldown.captain.losses, 1);
});

test("aggregatePlayerDrilldown handles traditional draft with no realm set gracefully", () => {
  const noRealmDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "no-realm",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    noRealmDrafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );

  assert.ok(drilldown);
  assert.deepEqual(drilldown.byRealm, {});
  assert.equal(drilldown.pvp.games, 0);
  assert.equal(drilldown.overall.wins, 1);
  assert.equal(drilldown.recentGames[0].playerRealm, undefined);
});

test("aggregateHeadToHeadRow supports unlinked player ids from verified drafts", () => {
  const mixedDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "u1",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { discordUserId: "d4", displayName: "Unlinked", team: 1, isCaptain: false },
        { discordUserId: "d1", displayName: "Alice", team: 2, isCaptain: false },
      ],
    },
    {
      shortId: "u2",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 2_000,
      winnerTeam: 2,
      resultStatus: "verified",
      players: [
        { discordUserId: "d4", displayName: "Unlinked", team: 1, isCaptain: false },
        { discordUserId: "d1", displayName: "Alice", team: 2, isCaptain: false },
      ],
    },
  ];

  const row = aggregateHeadToHeadRow(
    mixedDrafts,
    clerkByDiscord,
    namesByClerk,
    "discord:d4",
    "clerk_1",
    {}
  );

  assert.ok(row);
  assert.equal(row.playerClerkUserId, "discord:d4");
  assert.equal(row.playerName, "Unlinked");
  assert.equal(row.opponentClerkUserId, "clerk_1");
  assert.equal(row.opponentIsVerified, true);
  assert.equal(row.wins, 1);
  assert.equal(row.losses, 1);
  assert.equal(row.games, 2);
});

test("aggregateClassRows returns empty list when no one played class", () => {
  const rows = aggregateClassRows(drafts, clerkByDiscord, namesByClerk, "Armsman", {});
  assert.deepEqual(rows, []);
});

test("aggregateClassRows does not infer class data without fight snapshots", () => {
  const classDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "class1",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        {
          _id: "p1",
          discordUserId: "d1",
          displayName: "Alice",
          team: 1,
          isCaptain: false,
          selectedClass: "Armsman",
        },
        {
          _id: "p2",
          discordUserId: "d2",
          displayName: "Bob",
          team: 2,
          isCaptain: false,
          selectedClass: "Bard",
        },
      ],
    },
  ];

  const rows = aggregateClassRows(
    classDrafts,
    clerkByDiscord,
    namesByClerk,
    "Armsman",
    {}
  );

  assert.deepEqual(rows, []);
});

test("aggregateClassRows is fight-based when player swaps classes mid-set", () => {
  const classDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "class-switch",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 2_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        {
          _id: "p1",
          discordUserId: "d1",
          displayName: "Alice",
          team: 1,
          isCaptain: false,
        },
        {
          _id: "p2",
          discordUserId: "d2",
          displayName: "Bob",
          team: 2,
          isCaptain: false,
        },
      ],
      fights: [
        {
          fightNumber: 1,
          winnerTeam: 1,
          classesByPlayer: [
            { playerId: "p1", discordUserId: "d1", className: "Armsman" },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
        {
          fightNumber: 2,
          winnerTeam: 2,
          classesByPlayer: [
            { playerId: "p1", discordUserId: "d1", className: "Paladin" },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
      ],
    },
  ];

  const armsmanRows = aggregateClassRows(
    classDrafts,
    clerkByDiscord,
    namesByClerk,
    "Armsman",
    {}
  );
  assert.equal(armsmanRows.length, 1);
  assert.equal(armsmanRows[0].clerkUserId, "clerk_1");
  assert.equal(armsmanRows[0].wins, 1);
  assert.equal(armsmanRows[0].losses, 0);
  assert.equal(armsmanRows[0].games, 1);

  const paladinRows = aggregateClassRows(
    classDrafts,
    clerkByDiscord,
    namesByClerk,
    "Paladin",
    {}
  );
  assert.equal(paladinRows.length, 1);
  assert.equal(paladinRows[0].clerkUserId, "clerk_1");
  assert.equal(paladinRows[0].wins, 0);
  assert.equal(paladinRows[0].losses, 1);
  assert.equal(paladinRows[0].games, 1);
});

test("aggregateClassRows credits known substitutes and skips manual substitutes", () => {
  const substituteClerkMap = new Map<string, string>([
    ...Array.from(clerkByDiscord.entries()),
    ["d5", "clerk_5"],
  ]);
  const substituteNames = new Map<string, string>([
    ...Array.from(namesByClerk.entries()),
    ["clerk_5", "SubFive"],
  ]);

  const classDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "sub-class",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 8_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { _id: "p1", discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { _id: "p2", discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
      fights: [
        {
          fightNumber: 1,
          winnerTeam: 1,
          classesByPlayer: [
            { playerId: "p1", discordUserId: "d1", className: "Armsman" },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
        {
          fightNumber: 2,
          winnerTeam: 2,
          classesByPlayer: [
            {
              playerId: "p1",
              discordUserId: "d1",
              className: "Armsman",
              substituteMode: "known",
              substituteDiscordUserId: "d5",
              substituteDisplayName: "SubFive",
            },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
        {
          fightNumber: 3,
          winnerTeam: 1,
          classesByPlayer: [
            {
              playerId: "p1",
              discordUserId: "d1",
              className: "Armsman",
              substituteMode: "manual",
              substituteDisplayName: "ManualSub",
            },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
      ],
    },
  ];

  const armsmanRows = aggregateClassRows(
    classDrafts,
    substituteClerkMap,
    substituteNames,
    "Armsman",
    {}
  );

  const aliceRow = armsmanRows.find((row) => row.clerkUserId === "clerk_1");
  const subRow = armsmanRows.find((row) => row.clerkUserId === "clerk_5");
  assert.ok(aliceRow);
  assert.equal(aliceRow.wins, 1);
  assert.equal(aliceRow.losses, 0);
  assert.equal(aliceRow.games, 1);
  assert.ok(subRow);
  assert.equal(subRow.wins, 0);
  assert.equal(subRow.losses, 1);
  assert.equal(subRow.games, 1);
});

test("aggregatePlayerDrilldown returns data for unlinked player id", () => {
  const mixedDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "u3",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 1_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { discordUserId: "d4", displayName: "Unlinked", team: 1, isCaptain: true },
        { discordUserId: "d1", displayName: "Alice", team: 2, isCaptain: false },
        { discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: true },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    mixedDrafts,
    clerkByDiscord,
    namesByClerk,
    "discord:d4",
    {}
  );

  assert.ok(drilldown);
  assert.equal(drilldown.playerClerkUserId, "discord:d4");
  assert.equal(drilldown.isVerified, false);
  assert.equal(drilldown.profileName, undefined);
  assert.equal(drilldown.playerName, "Unlinked");
  assert.equal(drilldown.headToHead.length, 2);
  assert.equal(drilldown.headToHeadCaptain.length, 1);
  assert.equal(drilldown.headToHeadCaptain[0].opponentClerkUserId, "clerk_2");
  assert.equal(drilldown.teammateRecords.length, 0);
  const alice = drilldown.headToHead.find((row) => row.opponentClerkUserId === "clerk_1");
  assert.ok(alice);
  assert.equal(alice.opponentName, "Alice");
  assert.equal(alice.opponentIsVerified, true);
});

test("aggregatePlayerDrilldown class stats are fight-based for class swaps", () => {
  const classDrafts: DraftLeaderboardDraft[] = [
    {
      shortId: "switch-drilldown",
      type: "traditional",
      discordGuildId: "g1",
      _creationTime: 3_000,
      winnerTeam: 1,
      resultStatus: "verified",
      players: [
        { _id: "p1", discordUserId: "d1", displayName: "Alice", team: 1, isCaptain: false },
        { _id: "p2", discordUserId: "d2", displayName: "Bob", team: 2, isCaptain: false },
      ],
      fights: [
        {
          fightNumber: 1,
          winnerTeam: 1,
          classesByPlayer: [
            { playerId: "p1", discordUserId: "d1", className: "Armsman" },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
        {
          fightNumber: 2,
          winnerTeam: 2,
          classesByPlayer: [
            { playerId: "p1", discordUserId: "d1", className: "Paladin" },
            { playerId: "p2", discordUserId: "d2", className: "Bard" },
          ],
        },
      ],
    },
  ];

  const drilldown = aggregatePlayerDrilldown(
    classDrafts,
    clerkByDiscord,
    namesByClerk,
    "clerk_1",
    {}
  );
  assert.ok(drilldown);
  assert.equal(drilldown.byClass.Armsman?.wins, 1);
  assert.equal(drilldown.byClass.Armsman?.losses, 0);
  assert.equal(drilldown.byClass.Armsman?.games, 1);
  assert.equal(drilldown.byClass.Paladin?.wins, 0);
  assert.equal(drilldown.byClass.Paladin?.losses, 1);
  assert.equal(drilldown.byClass.Paladin?.games, 1);
});
