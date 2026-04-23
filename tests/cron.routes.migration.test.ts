import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createBatchedLeaderboardUpdateRouteHandlers } from "../src/server/api/batchedLeaderboardUpdateRouteHandlers";
import { createUpdateLeaderboardStatsRouteHandlers } from "../src/server/api/updateLeaderboardStatsRouteHandlers";
import { createBatchedRealmUpdateRouteHandlers } from "../src/server/api/batchedRealmUpdateRouteHandlers";
import { createBatchedHeraldUpdateRouteHandlers } from "../src/server/api/batchedHeraldUpdateRouteHandlers";
import { createUpdateCharacterNamesRouteHandlers } from "../src/server/api/updateCharacterNamesRouteHandlers";
import { createResetLastWeekStatsRouteHandlers } from "../src/server/api/resetLastWeekStatsRouteHandlers";
import { createResetBatchStateRouteHandlers } from "../src/server/api/resetBatchStateRouteHandlers";
import { createResetHeraldBatchStateRouteHandlers } from "../src/server/api/resetHeraldBatchStateRouteHandlers";

function authorizedRequest(url: string, method: string) {
  return new Request(url, {
    method,
    headers: { authorization: "Bearer secret" },
  }) as any;
}

function unauthorizedRequest(url: string, method: string) {
  return new Request(url, { method }) as any;
}

test("cron handlers reject Bearer undefined when secret is missing", async () => {
  const handlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: undefined,
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/batchedLeaderboardUpdate", {
      method: "POST",
      headers: { authorization: "Bearer undefined" },
    }) as any
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: "Unauthorized" });
});

test("all cron handlers return 401 without valid bearer token", async () => {
  const batchedLeaderboardHandlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });
  const updateLeaderboardHandlers = createUpdateLeaderboardStatsRouteHandlers({
    cronSecret: "secret",
    findCharacters: async () => [],
    updateCharacterByWebId: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const batchedRealmHandlers = createBatchedRealmUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacterRealm: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const batchedHeraldHandlers = createBatchedHeraldUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedHeraldCharacterId: async () => 0,
    updateLastProcessedHeraldCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const updateNamesHandlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => 0,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });
  const resetLastWeekHandlers = createResetLastWeekStatsRouteHandlers({
    cronSecret: "secret",
    findCharactersToReset: async () => [],
    resetCharactersByIds: async () => undefined,
  });
  const resetBatchHandlers = createResetBatchStateRouteHandlers({
    cronSecret: "secret",
    resetBatchState: async () => undefined,
  });
  const resetHeraldBatchHandlers = createResetHeraldBatchStateRouteHandlers({
    cronSecret: "secret",
    resetHeraldBatchState: async () => undefined,
  });

  const responses = await Promise.all([
    batchedLeaderboardHandlers.POST(
      unauthorizedRequest("http://localhost/api/batchedLeaderboardUpdate", "POST")
    ),
    updateLeaderboardHandlers.POST(
      unauthorizedRequest("http://localhost/api/updateLeaderboardStats", "POST")
    ),
    batchedRealmHandlers.POST(
      unauthorizedRequest("http://localhost/api/batchedRealmUpdate", "POST")
    ),
    batchedHeraldHandlers.POST(
      unauthorizedRequest("http://localhost/api/batchedHeraldUpdate", "POST")
    ),
    updateNamesHandlers.POST(
      unauthorizedRequest("http://localhost/api/updateCharacterNames", "POST")
    ),
    resetLastWeekHandlers.POST(
      unauthorizedRequest("http://localhost/api/resetLastWeekStats", "POST")
    ),
    resetBatchHandlers.POST(
      unauthorizedRequest("http://localhost/api/resetBatchState", "POST")
    ),
    resetHeraldBatchHandlers.POST(
      unauthorizedRequest("http://localhost/api/resetHeraldBatchState", "POST")
    ),
  ]);

  for (const response of responses) {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "Unauthorized" });
  }
});

test("reset handlers check auth before method leakage", async () => {
  const resetBatchHandlers = createResetBatchStateRouteHandlers({
    cronSecret: "secret",
    resetBatchState: async () => undefined,
  });
  const resetLastWeekHandlers = createResetLastWeekStatsRouteHandlers({
    cronSecret: "secret",
    findCharactersToReset: async () => [],
    resetCharactersByIds: async () => undefined,
  });

  const resetBatchResponse = await resetBatchHandlers.GET(
    unauthorizedRequest("http://localhost/api/resetBatchState", "GET")
  );
  const resetLastWeekResponse = await resetLastWeekHandlers.GET(
    unauthorizedRequest("http://localhost/api/resetLastWeekStats", "GET")
  );

  assert.equal(resetBatchResponse.status, 401);
  assert.equal(resetBatchResponse.headers.get("Allow"), null);
  assert.deepEqual(await resetBatchResponse.json(), { message: "Unauthorized" });

  assert.equal(resetLastWeekResponse.status, 401);
  assert.equal(resetLastWeekResponse.headers.get("Allow"), null);
  assert.deepEqual(await resetLastWeekResponse.json(), {
    message: "Unauthorized",
  });
});

test("all cron handlers enforce POST with 405 and Allow header", async () => {
  const batchedLeaderboardHandlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });
  const updateLeaderboardHandlers = createUpdateLeaderboardStatsRouteHandlers({
    cronSecret: "secret",
    findCharacters: async () => [],
    updateCharacterByWebId: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const batchedRealmHandlers = createBatchedRealmUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacterRealm: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const batchedHeraldHandlers = createBatchedHeraldUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedHeraldCharacterId: async () => 0,
    updateLastProcessedHeraldCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });
  const updateNamesHandlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => 0,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });
  const resetLastWeekHandlers = createResetLastWeekStatsRouteHandlers({
    cronSecret: "secret",
    findCharactersToReset: async () => [],
    resetCharactersByIds: async () => undefined,
  });
  const resetBatchHandlers = createResetBatchStateRouteHandlers({
    cronSecret: "secret",
    resetBatchState: async () => undefined,
  });
  const resetHeraldBatchHandlers = createResetHeraldBatchStateRouteHandlers({
    cronSecret: "secret",
    resetHeraldBatchState: async () => undefined,
  });

  const responses = await Promise.all([
    batchedLeaderboardHandlers.GET(
      authorizedRequest("http://localhost/api/batchedLeaderboardUpdate", "GET")
    ),
    updateLeaderboardHandlers.GET(
      authorizedRequest("http://localhost/api/updateLeaderboardStats", "GET")
    ),
    batchedRealmHandlers.GET(
      authorizedRequest("http://localhost/api/batchedRealmUpdate", "GET")
    ),
    batchedHeraldHandlers.GET(
      authorizedRequest("http://localhost/api/batchedHeraldUpdate", "GET")
    ),
    updateNamesHandlers.GET(
      authorizedRequest("http://localhost/api/updateCharacterNames", "GET")
    ),
    resetLastWeekHandlers.GET(
      authorizedRequest("http://localhost/api/resetLastWeekStats", "GET")
    ),
    resetBatchHandlers.GET(
      authorizedRequest("http://localhost/api/resetBatchState", "GET")
    ),
    resetHeraldBatchHandlers.GET(
      authorizedRequest("http://localhost/api/resetHeraldBatchState", "GET")
    ),
  ]);

  for (const response of responses) {
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
  }
});

test("batched leaderboard preserves cursor update and success payload", async () => {
  let updatedCursor = -1;
  const updatedRows: Array<{ id: number; data: Record<string, unknown> }> = [];
  const handlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 9,
    updateLastProcessedCharacterId: async (lastId) => {
      updatedCursor = lastId;
    },
    findCharacters: async () => [
      {
        id: 10,
        webId: "w10",
        totalRealmPoints: 10,
        totalKills: 11,
        totalSoloKills: 10,
        totalDeaths: 10,
        totalDeathBlows: 10,
        realmPointsLastWeek: 0,
        killsLastWeek: 0,
        soloKillsLastWeek: 0,
        deathsLastWeek: 0,
        deathBlowsLastWeek: 0,
        lastUpdated: new Date("2026-03-30T05:00:00.000Z"),
      },
    ],
    updateCharacter: async ({ id, data }) => {
      updatedRows.push({ id, data: data as unknown as Record<string, unknown> });
    },
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          realm_war_stats: {
            current: {
              realm_points: 15,
              player_kills: {
                total: {
                  kills: 16,
                  solo_kills: 12,
                  deaths: 11,
                  death_blows: 14,
                },
              },
            },
          },
        })
      )) as typeof fetch,
    now: () => new Date("2026-04-06T05:10:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedLeaderboardUpdate", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(updatedCursor, 10);
  assert.equal(updatedRows.length, 1);
  assert.deepEqual(await response.json(), {
    message: "Batch update process completed",
    checkedCharacters: 1,
    updatedCharacters: 1,
    failedUpdates: 0,
  });
});

test("batched leaderboard uses previous Monday window before update hour", async () => {
  let capturedCutoffIso: string | null = null;
  const handlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async ({ lastUpdatedLte }) => {
      capturedCutoffIso = lastUpdatedLte.toISOString();
      return [];
    },
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T04:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedLeaderboardUpdate", "POST")
  );

  assert.equal(response.status, 200);
  assert.equal(capturedCutoffIso, "2026-03-30T05:30:00.000Z");
  assert.deepEqual(await response.json(), {
    message: "Batch update process completed",
    checkedCharacters: 0,
    updatedCharacters: 0,
    failedUpdates: 0,
  });
});

test("batched leaderboard returns 500 on initialization failure", async () => {
  const handlers = createBatchedLeaderboardUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => {
      throw new Error("db unavailable");
    },
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedLeaderboardUpdate", "POST")
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Internal server error" });
});

test("batched realm preserves cursor update and valid realm mapping", async () => {
  let updatedCursor = -1;
  let updatedRealm = "";
  const handlers = createBatchedRealmUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 2,
    updateLastProcessedCharacterId: async (lastId) => {
      updatedCursor = lastId;
    },
    findCharacters: async () => [{ id: 3, webId: "w3" }],
    updateCharacterRealm: async ({ realm }) => {
      updatedRealm = realm;
    },
    fetchImpl: (async () => new Response(JSON.stringify({ realm: 3 }))) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedRealmUpdate", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(updatedCursor, 3);
  assert.equal(updatedRealm, "Hibernia");
  assert.deepEqual(await response.json(), {
    message: "Batch realm update process completed",
    updatedRealms: 1,
    failedUpdates: 0,
  });
});

test("batched realm does not overwrite on null or invalid realm", async () => {
  let updateCalls = 0;
  const handlers = createBatchedRealmUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => [
      { id: 1, webId: "null-realm" },
      { id: 2, webId: "invalid-realm" },
    ],
    updateCharacterRealm: async () => {
      updateCalls += 1;
    },
    fetchImpl: (async (input: RequestInfo | URL) => {
      if (String(input).includes("null-realm")) {
        return new Response(JSON.stringify({ realm: null }));
      }
      return new Response(JSON.stringify({ realm: 99 }));
    }) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedRealmUpdate", "POST")
  );

  assert.equal(response.status, 200);
  assert.equal(updateCalls, 0);
  assert.deepEqual(await response.json(), {
    message: "Batch realm update process completed",
    updatedRealms: 0,
    failedUpdates: 2,
  });
});

test("batched realm returns 500 on initialization failure", async () => {
  const handlers = createBatchedRealmUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedCharacterId: async () => 0,
    updateLastProcessedCharacterId: async () => undefined,
    findCharacters: async () => {
      throw new Error("query failed");
    },
    updateCharacterRealm: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedRealmUpdate", "POST")
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Internal server error" });
});

test("batched herald keeps partial failures non-fatal and reports failedUpdates", async () => {
  let cursorValue = -1;
  const handlers = createBatchedHeraldUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedHeraldCharacterId: async () => 0,
    updateLastProcessedHeraldCharacterId: async (lastId) => {
      cursorValue = lastId;
    },
    findCharacters: async () => [
      {
        id: 1,
        webId: "ok",
        heraldCharacterWebId: null,
        heraldName: null,
        heraldServerName: null,
        heraldRealm: null,
        heraldRace: null,
        heraldClassName: null,
        heraldLevel: null,
        heraldGuildName: null,
        heraldRealmPoints: null,
        heraldBountyPoints: null,
        heraldTotalKills: null,
        heraldTotalDeaths: null,
        heraldTotalDeathBlows: null,
        heraldTotalSoloKills: null,
        heraldMidgardKills: null,
        heraldMidgardDeaths: null,
        heraldMidgardDeathBlows: null,
        heraldMidgardSoloKills: null,
        heraldAlbionKills: null,
        heraldAlbionDeaths: null,
        heraldAlbionDeathBlows: null,
        heraldAlbionSoloKills: null,
        heraldHiberniaKills: null,
        heraldHiberniaDeaths: null,
        heraldHiberniaDeathBlows: null,
        heraldHiberniaSoloKills: null,
        heraldMasterLevel: null,
      },
      {
        id: 2,
        webId: "bad",
        heraldCharacterWebId: null,
        heraldName: null,
        heraldServerName: null,
        heraldRealm: null,
        heraldRace: null,
        heraldClassName: null,
        heraldLevel: null,
        heraldGuildName: null,
        heraldRealmPoints: null,
        heraldBountyPoints: null,
        heraldTotalKills: null,
        heraldTotalDeaths: null,
        heraldTotalDeathBlows: null,
        heraldTotalSoloKills: null,
        heraldMidgardKills: null,
        heraldMidgardDeaths: null,
        heraldMidgardDeathBlows: null,
        heraldMidgardSoloKills: null,
        heraldAlbionKills: null,
        heraldAlbionDeaths: null,
        heraldAlbionDeathBlows: null,
        heraldAlbionSoloKills: null,
        heraldHiberniaKills: null,
        heraldHiberniaDeaths: null,
        heraldHiberniaDeathBlows: null,
        heraldHiberniaSoloKills: null,
        heraldMasterLevel: null,
      },
    ],
    updateCharacter: async () => undefined,
    fetchImpl: (async (input: RequestInfo | URL) => {
      if (String(input).includes("/bad")) {
        throw new Error("network");
      }
      return new Response(
        JSON.stringify({
          realm_war_stats: { current: { player_kills: { total: {} } } },
          name: "Name",
        })
      );
    }) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedHeraldUpdate", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(cursorValue, 2);
  assert.deepEqual(await response.json(), {
    message: "Batch update process completed",
    checkedCharacters: 2,
    updatedCharacters: 1,
    failedUpdates: 1,
  });
});

test("batched herald does not write undefined master level strings", async () => {
  let updateCalls = 0;
  const handlers = createBatchedHeraldUpdateRouteHandlers({
    cronSecret: "secret",
    getLastProcessedHeraldCharacterId: async () => 0,
    updateLastProcessedHeraldCharacterId: async () => undefined,
    findCharacters: async () => [
      {
        id: 1,
        webId: "no-ml",
        heraldCharacterWebId: null,
        heraldName: null,
        heraldServerName: null,
        heraldRealm: null,
        heraldRace: null,
        heraldClassName: null,
        heraldLevel: null,
        heraldGuildName: null,
        heraldRealmPoints: null,
        heraldBountyPoints: null,
        heraldTotalKills: null,
        heraldTotalDeaths: null,
        heraldTotalDeathBlows: null,
        heraldTotalSoloKills: null,
        heraldMidgardKills: null,
        heraldMidgardDeaths: null,
        heraldMidgardDeathBlows: null,
        heraldMidgardSoloKills: null,
        heraldAlbionKills: null,
        heraldAlbionDeaths: null,
        heraldAlbionDeathBlows: null,
        heraldAlbionSoloKills: null,
        heraldHiberniaKills: null,
        heraldHiberniaDeaths: null,
        heraldHiberniaDeathBlows: null,
        heraldHiberniaSoloKills: null,
        heraldMasterLevel: null,
      },
    ],
    updateCharacter: async () => {
      updateCalls += 1;
    },
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          realm_war_stats: { current: { player_kills: { total: {} } } },
        })
      )) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/batchedHeraldUpdate", "POST")
  );

  assert.equal(response.status, 200);
  assert.equal(updateCalls, 0);
  assert.deepEqual(await response.json(), {
    message: "Batch update process completed",
    checkedCharacters: 1,
    updatedCharacters: 0,
    failedUpdates: 0,
  });
});

test("update leaderboard stats returns success response", async () => {
  const handlers = createUpdateLeaderboardStatsRouteHandlers({
    cronSecret: "secret",
    findCharacters: async ({ skip }) =>
      skip === 0
        ? [
            {
              webId: "w1",
              totalRealmPoints: 1,
              totalKills: 1,
              totalSoloKills: 2,
              totalDeaths: 3,
              totalDeathBlows: 4,
            },
          ]
        : [],
    updateCharacterByWebId: async () => undefined,
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          realm_war_stats: {
            current: {
              realm_points: 2,
              player_kills: {
                total: { kills: 4, solo_kills: 3, deaths: 4, death_blows: 5 },
              },
            },
          },
        })
      )) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateLeaderboardStats", "POST")
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "Leaderboard stats updated successfully",
  });
});

test("update leaderboard stats clamps negative weekly deltas to zero", async () => {
  let capturedUpdate:
    | {
        webId: string;
        data: {
          totalRealmPoints: number;
          realmPointsLastWeek: number;
          totalKills: number;
          killsLastWeek: number;
          totalSoloKills: number;
          soloKillsLastWeek: number;
          totalDeaths: number;
          deathsLastWeek: number;
          totalDeathBlows: number;
          deathBlowsLastWeek: number;
        };
      }
    | null = null;

  const handlers = createUpdateLeaderboardStatsRouteHandlers({
    cronSecret: "secret",
    findCharacters: async ({ skip }) =>
      skip === 0
        ? [
            {
              webId: "w1",
              totalRealmPoints: 100,
              totalKills: 80,
              totalSoloKills: 50,
              totalDeaths: 20,
              totalDeathBlows: 30,
            },
          ]
        : [],
    updateCharacterByWebId: async (args) => {
      capturedUpdate = args;
    },
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          realm_war_stats: {
            current: {
              realm_points: 90,
              player_kills: {
                total: { kills: 75, solo_kills: 40, deaths: 10, death_blows: 25 },
              },
            },
          },
        })
      )) as typeof fetch,
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateLeaderboardStats", "POST")
  );

  assert.equal(response.status, 200);
  assert.deepEqual(capturedUpdate, {
    webId: "w1",
    data: {
      totalRealmPoints: 90,
      realmPointsLastWeek: 0,
      totalKills: 75,
      killsLastWeek: 0,
      totalSoloKills: 40,
      soloKillsLastWeek: 0,
      totalDeaths: 10,
      deathsLastWeek: 0,
      totalDeathBlows: 25,
      deathBlowsLastWeek: 0,
    },
  });
});

test("update character names returns success and handles per-character failures", async () => {
  let updates = 0;
  const handlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => 0,
    findCharacters: async ({ lastProcessedId }) =>
      lastProcessedId === 0
        ? [
            {
              id: 1,
              webId: "w1",
              characterName: "Unknown",
              className: "Unknown",
              nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
            },
            {
              id: 2,
              webId: "w2",
              characterName: "Unknown",
              className: "Unknown",
              nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
            },
          ]
        : [],
    updateCharacter: async () => {
      updates += 1;
    },
    fetchImpl: (async (input: RequestInfo | URL) => {
      if (String(input).includes("/w2")) {
        throw new Error("failed");
      }
      return new Response(JSON.stringify({ name: "New Name", class_name: "Wizard" }));
    }) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateCharacterNames", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(updates, 1);
  assert.deepEqual(await response.json(), {
    message: "Character names update process completed",
    updatedCharacters: 1,
    failedUpdates: 1,
  });
});

test("update character names uses cursor pagination without skip drift", async () => {
  let updates = 0;
  const seenCursorValues: number[] = [];
  const handlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => 0,
    findCharacters: async ({ lastProcessedId }) => {
      seenCursorValues.push(lastProcessedId);
      if (lastProcessedId === 0) {
        return [
          {
            id: 1,
            webId: "w1",
            characterName: "Unknown",
            className: "Unknown",
            nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
          },
          {
            id: 2,
            webId: "w2",
            characterName: "Unknown",
            className: "Unknown",
            nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
          },
        ];
      }
      if (lastProcessedId === 2) {
        return [
          {
            id: 3,
            webId: "w3",
            characterName: "Unknown",
            className: "Unknown",
            nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
          },
        ];
      }
      return [];
    },
    updateCharacter: async () => {
      updates += 1;
    },
    fetchImpl: (async () =>
      new Response(JSON.stringify({ name: "Updated Name", class_name: "Wizard" }))) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateCharacterNames", "POST")
  );

  assert.equal(response.status, 200);
  assert.equal(updates, 3);
  assert.deepEqual(seenCursorValues, [0, 2, 3]);
  assert.deepEqual(await response.json(), {
    message: "Character names update process completed",
    updatedCharacters: 3,
    failedUpdates: 0,
  });
});

test("update character names bumps timestamp even when values are unchanged", async () => {
  let capturedUpdate: { id: number; data: { nameLastUpdated: Date } } | null = null;
  const handlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => 0,
    findCharacters: async ({ lastProcessedId }) =>
      lastProcessedId === 0
        ? [
            {
              id: 10,
              webId: "w10",
              characterName: "Unknown",
              className: "Unknown",
              nameLastUpdated: new Date("2026-04-05T00:00:00.000Z"),
            },
          ]
        : [],
    updateCharacter: async ({ id, data }) => {
      capturedUpdate = { id, data: { nameLastUpdated: data.nameLastUpdated } };
    },
    fetchImpl: (async () =>
      new Response(JSON.stringify({ name: "Unknown", class_name: "Unknown" }))) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateCharacterNames", "POST")
  );

  assert.equal(response.status, 200);
  assert.deepEqual(capturedUpdate, {
    id: 10,
    data: { nameLastUpdated: new Date("2026-04-06T05:00:00.000Z") },
  });
  assert.deepEqual(await response.json(), {
    message: "Character names update process completed",
    updatedCharacters: 0,
    failedUpdates: 0,
  });
});

test("update character names returns 500 on initialization failure", async () => {
  const handlers = createUpdateCharacterNamesRouteHandlers({
    cronSecret: "secret",
    countUnknownCharacters: async () => {
      throw new Error("count failed");
    },
    findCharacters: async () => [],
    updateCharacter: async () => undefined,
    fetchImpl: (async () => new Response("{}")) as typeof fetch,
    now: () => new Date("2026-04-06T05:00:00.000Z"),
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateCharacterNames", "POST")
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Internal server error" });
});

test("reset last week stats resets by batches and reports count", async () => {
  let batches = 0;
  const handlers = createResetLastWeekStatsRouteHandlers({
    cronSecret: "secret",
    findCharactersToReset: async ({ lastProcessedId }) =>
      lastProcessedId === 0 ? [{ id: 1 }, { id: 2 }] : [],
    resetCharactersByIds: async () => {
      batches += 1;
    },
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/resetLastWeekStats", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(batches, 1);
  assert.deepEqual(await response.json(), {
    message: "Successfully reset last week's stats for 2 characters",
  });
});

test("reset batch state returns 500 on failure", async () => {
  const handlers = createResetBatchStateRouteHandlers({
    cronSecret: "secret",
    resetBatchState: async () => {
      throw new Error("db");
    },
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/resetBatchState", "POST")
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    message: "Error resetting batch state",
  });
});

test("reset herald batch state resets successfully", async () => {
  let called = false;
  const handlers = createResetHeraldBatchStateRouteHandlers({
    cronSecret: "secret",
    resetHeraldBatchState: async () => {
      called = true;
    },
  });

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/resetHeraldBatchState", "POST")
  );
  assert.equal(response.status, 200);
  assert.equal(called, true);
  assert.deepEqual(await response.json(), {
    message: "Herald batch state reset successfully",
  });
});

test("migration guard: app routes exist and pages routes are removed", () => {
  const appRoutes = [
    "src/app/api/batchedLeaderboardUpdate/route.ts",
    "src/app/api/updateLeaderboardStats/route.ts",
    "src/app/api/batchedRealmUpdate/route.ts",
    "src/app/api/batchedHeraldUpdate/route.ts",
    "src/app/api/updateCharacterNames/route.ts",
    "src/app/api/resetLastWeekStats/route.ts",
    "src/app/api/resetBatchState/route.ts",
    "src/app/api/resetHeraldBatchState/route.ts",
  ];
  const legacyPagesRoutes = [
    "pages/api/batchedLeaderboardUpdate/index.ts",
    "pages/api/updateLeaderboardStats/index.ts",
    "pages/api/batchedRealmUpdate/index.ts",
    "pages/api/batchedHeraldUpdate/index.ts",
    "pages/api/updateCharacterNames/index.ts",
    "pages/api/resetLastWeekStats/index.ts",
    "pages/api/resetBatchState/index.ts",
    "pages/api/resetHeraldBatchState/index.ts",
  ];

  for (const route of appRoutes) {
    assert.equal(existsSync(route), true);
  }
  for (const route of legacyPagesRoutes) {
    assert.equal(existsSync(route), false);
  }
});

test("batched realm route uses independent cursor key wiring", () => {
  const realmRouteSource = readFileSync(
    "src/app/api/batchedRealmUpdate/route.ts",
    "utf8"
  );

  assert.equal(
    realmRouteSource.includes("getLastProcessedRealmCharacterId"),
    true
  );
  assert.equal(
    realmRouteSource.includes("updateLastProcessedRealmCharacterId"),
    true
  );
  assert.equal(
    realmRouteSource.includes("getLastProcessedCharacterId(prisma)"),
    false
  );
  assert.equal(
    realmRouteSource.includes("updateLastProcessedCharacterId(prisma, lastId)"),
    false
  );
});

test("reset last week route includes death blow weekly reset field", () => {
  const resetRouteSource = readFileSync(
    "src/app/api/resetLastWeekStats/route.ts",
    "utf8"
  );

  assert.equal(
    resetRouteSource.includes("{ deathBlowsLastWeek: { not: 0 } }"),
    true
  );
  assert.equal(resetRouteSource.includes("deathBlowsLastWeek: 0"), true);
});

test("update leaderboard stats route uses deterministic ordered pagination", () => {
  const updateRouteSource = readFileSync(
    "src/app/api/updateLeaderboardStats/route.ts",
    "utf8"
  );

  assert.equal(updateRouteSource.includes("orderBy: { id: \"asc\" }"), true);
});

test("reset batch state route resets leaderboard and realm cursors", () => {
  const resetBatchRouteSource = readFileSync(
    "src/app/api/resetBatchState/route.ts",
    "utf8"
  );

  assert.equal(
    resetBatchRouteSource.includes("key: \"lastProcessedCharacterId\""),
    true
  );
  assert.equal(
    resetBatchRouteSource.includes("key: \"lastProcessedRealmCharacterId\""),
    true
  );
});
