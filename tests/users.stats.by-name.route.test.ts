import test from "node:test";
import assert from "node:assert/strict";
import { createUsersStatsByNameRouteHandlers } from "../src/server/usersStatsByNameRouteHandlers";

function buildHandlers(
  overrides?: Partial<{
    getAllUserNames: () => Promise<string[]>;
    getUserStatsByName: (name: string) => Promise<any>;
  }>
) {
  return createUsersStatsByNameRouteHandlers({
    apiSecret: "secret",
    deps: {
      getAllUserNames: overrides?.getAllUserNames ?? (async () => ["Alice"]),
      getUserStatsByName:
        overrides?.getUserStatsByName ??
        (async () => ({
          name: "Alice",
          characters: [
            {
              character: {
                totalRealmPoints: 100,
                totalSoloKills: 10,
                totalDeaths: 5,
                deathsLastWeek: 2,
                realmPointsLastWeek: 20,
                soloKillsLastWeek: 3,
                lastUpdated: new Date("2026-01-01T00:00:00.000Z"),
              },
            },
            {
              character: {
                totalRealmPoints: 50,
                totalSoloKills: 5,
                totalDeaths: 0,
                deathsLastWeek: 0,
                realmPointsLastWeek: 10,
                soloKillsLastWeek: 1,
                lastUpdated: new Date("2026-01-02T00:00:00.000Z"),
              },
            },
          ],
        })),
    },
  });
}

test("users stats route GET returns aggregate payload", async () => {
  const handlers = buildHandlers();

  const response = await handlers.GET(
    new Request("http://localhost/api/users/stats/Alic", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alic" } }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    userName: "Alice",
    totalRealmPoints: 150,
    totalSoloKills: 15,
    totalDeaths: 5,
    deathsLastWeek: 2,
    realmPointsLastWeek: 30,
    soloKillsLastWeek: 4,
    irs: 30,
    irsLastWeek: 15,
    lastUpdated: "2026-01-02T00:00:00.000Z",
  });
});

test("users stats route enforces auth and method guard", async () => {
  const handlers = buildHandlers();

  const unauthorized = await handlers.GET(
    new Request("http://localhost/api/users/stats/Alice") as any,
    { params: { name: "Alice" } }
  );
  assert.equal(unauthorized.status, 401);

  const methodNotAllowed = await handlers.POST(
    new Request("http://localhost/api/users/stats/Alice", {
      method: "POST",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("Allow"), "GET");
});

test("users stats route validates name and not found branches", async () => {
  const handlers = buildHandlers({
    getAllUserNames: async () => ["Zed"],
  });

  const missingName = await handlers.GET(
    new Request("http://localhost/api/users/stats", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: {} }
  );
  assert.equal(missingName.status, 400);
  assert.deepEqual(await missingName.json(), { message: "User name must be a string." });

  const noClosestMatch = await handlers.GET(
    new Request("http://localhost/api/users/stats/Alice", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(noClosestMatch.status, 404);
  assert.deepEqual(await noClosestMatch.json(), { message: "User Alice not found" });

  const handlersMissingUser = buildHandlers({
    getUserStatsByName: async () => null,
  });
  const missingUser = await handlersMissingUser.GET(
    new Request("http://localhost/api/users/stats/Alice", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(missingUser.status, 404);
  assert.deepEqual(await missingUser.json(), { message: "User not found" });
});

test("users stats route returns 500 on dependency error", async () => {
  const handlers = buildHandlers({
    getAllUserNames: async () => {
      throw new Error("boom");
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/users/stats/Alice", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Error fetching user stats" });
});
