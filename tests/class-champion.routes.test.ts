import assert from "node:assert/strict";
import test from "node:test";
import { createUpdateClassChampionsRouteHandlers } from "../src/server/api/classChampionRouteHandlers";

function authorizedRequest(url: string, method: string) {
  return new Request(url, {
    method,
    headers: { authorization: "Bearer secret" },
  }) as any;
}

test("updateClassChampions cron requires auth and returns sync summary", async () => {
  const handlers = createUpdateClassChampionsRouteHandlers({
    cronSecret: "secret",
    syncClassChampions: async () => ({
      checked: 3,
      synced: 2,
      invalid: 1,
      failed: 0,
      results: [
        {
          heraldServerName: "Ywain",
          canonicalClassName: "Cabalist",
          realm: "Albion",
          webId: "123",
          heraldName: "Testalist",
          heraldRealmPoints: 5_000_000,
          source: "excidio-class-leaderboard",
          sourceUrl: "http://www.excidio.net/herald/list/character:rps::1:13:0:desc:::1",
          sourceRank: 1,
          sourceFetchedAt: new Date("2026-01-01T00:00:00.000Z"),
          validatedAt: new Date("2026-01-01T00:00:00.000Z"),
          validationStatus: "valid" as const,
        },
      ],
    }),
  });

  const unauthorized = await handlers.POST(
    new Request("http://localhost/api/updateClassChampions", {
      method: "POST",
    }) as any
  );
  assert.equal(unauthorized.status, 401);

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateClassChampions", "POST")
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "Class champion sync completed",
    checked: 3,
    synced: 2,
    invalid: 1,
    failed: 0,
    results: [
      {
        heraldServerName: "Ywain",
        canonicalClassName: "Cabalist",
        realm: "Albion",
        webId: "123",
        heraldName: "Testalist",
        heraldRealmPoints: 5_000_000,
        source: "excidio-class-leaderboard",
        sourceUrl: "http://www.excidio.net/herald/list/character:rps::1:13:0:desc:::1",
        sourceRank: 1,
        sourceFetchedAt: "2026-01-01T00:00:00.000Z",
        validatedAt: "2026-01-01T00:00:00.000Z",
        validationStatus: "valid",
      },
    ],
  });
});
