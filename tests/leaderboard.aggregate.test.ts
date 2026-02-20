import test from "node:test";
import assert from "node:assert/strict";
import { aggregateLeaderboardData } from "../src/server/leaderboard";

test("aggregateLeaderboardData aggregates totals and sorts descending", () => {
  const data = [
    {
      id: 1,
      name: "Alice",
      clerkUserId: "u_1",
      characters: [
        {
          character: {
            id: 101,
            totalRealmPoints: 1000,
            totalSoloKills: 50,
            totalDeaths: 10,
            totalDeathBlows: 20,
            deathsLastWeek: 2,
            deathBlowsLastWeek: 5,
            realmPointsLastWeek: 200,
            soloKillsLastWeek: 10,
            lastUpdated: null,
            heraldRealmPoints: 1200,
            heraldTotalDeaths: 12,
            heraldTotalSoloKills: 55,
            heraldTotalDeathBlows: 24,
          },
        },
      ],
    },
    {
      id: 2,
      name: "Bob",
      clerkUserId: "u_2",
      characters: [
        {
          character: {
            id: 201,
            totalRealmPoints: 600,
            totalSoloKills: 20,
            totalDeaths: 6,
            totalDeathBlows: 12,
            deathsLastWeek: 1,
            deathBlowsLastWeek: 2,
            realmPointsLastWeek: 100,
            soloKillsLastWeek: 3,
            lastUpdated: null,
            heraldRealmPoints: 650,
            heraldTotalDeaths: 7,
            heraldTotalSoloKills: 22,
            heraldTotalDeathBlows: 13,
          },
        },
      ],
    },
  ];

  const result = aggregateLeaderboardData(data);

  assert.equal(result[0].userName, "Alice");
  assert.equal(result[0].totalRealmPoints, 1000);
  assert.equal(result[0].realmPointsThisWeek, 200);
  assert.equal(result[0].deathsThisWeek, 2);
  assert.equal(result[0].irs, 100);
});

test("aggregateLeaderboardData deduplicates repeated character ids and clamps weekly negatives", () => {
  const data = [
    {
      id: 1,
      name: "Alice",
      clerkUserId: "u_1",
      supporterTier: 0,
      characters: [
        {
          character: {
            id: 101,
            totalRealmPoints: 1000,
            totalSoloKills: 50,
            totalDeaths: 10,
            totalDeathBlows: 20,
            deathsLastWeek: 2,
            deathBlowsLastWeek: 5,
            realmPointsLastWeek: 200,
            soloKillsLastWeek: 10,
            lastUpdated: null,
            heraldRealmPoints: 900,
            heraldTotalDeaths: 9,
            heraldTotalSoloKills: 49,
            heraldTotalDeathBlows: 19,
          },
        },
        {
          character: {
            id: 101,
            totalRealmPoints: 1000,
            totalSoloKills: 50,
            totalDeaths: 10,
            totalDeathBlows: 20,
            deathsLastWeek: 2,
            deathBlowsLastWeek: 5,
            realmPointsLastWeek: 200,
            soloKillsLastWeek: 10,
            lastUpdated: null,
            heraldRealmPoints: 900,
            heraldTotalDeaths: 9,
            heraldTotalSoloKills: 49,
            heraldTotalDeathBlows: 19,
          },
        },
      ],
    },
  ];

  const result = aggregateLeaderboardData(data);

  assert.equal(result.length, 1);
  assert.equal(result[0].totalRealmPoints, 1000);
  assert.equal(result[0].realmPointsThisWeek, 0);
  assert.equal(result[0].deathsThisWeek, 0);
  assert.equal(result[0].soloKillsThisWeek, 0);
  assert.equal(result[0].deathBlowsThisWeek, 0);
});
