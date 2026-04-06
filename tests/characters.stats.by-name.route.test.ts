import test from "node:test";
import assert from "node:assert/strict";
import { createCharacterStatsByNameRouteHandlers } from "../src/server/characterStatsByNameRouteHandlers";

function buildHandlers(
  overrides?: Partial<{
    getCharacterStatsByName: (name: string) => Promise<any>;
  }>
) {
  return createCharacterStatsByNameRouteHandlers({
    apiSecret: "secret",
    deps: {
      getCharacterStatsByName:
        overrides?.getCharacterStatsByName ??
        (async () => ({
          characterName: "Kobold",
          className: "Warlock",
          totalRealmPoints: 1200,
          totalSoloKills: 40,
          totalDeaths: 10,
          deathsLastWeek: 2,
          realmPointsLastWeek: 100,
          soloKillsLastWeek: 5,
        })),
    },
  });
}

test("characters stats route GET returns expected payload", async () => {
  const handlers = buildHandlers();

  const response = await handlers.GET(
    new Request("http://localhost/api/characters/stats/Kobold", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Kobold" } }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    characterName: "Kobold",
    className: "Warlock",
    formattedRank: "1L5",
    totalSoloKills: 40,
    totalDeaths: 10,
    deathsLastWeek: 2,
    realmPointsLastWeek: 100,
    soloKillsLastWeek: 5,
    irs: 120,
    irsLastWeek: 50,
  });
});

test("characters stats route enforces auth and method guard", async () => {
  const handlers = buildHandlers();

  const unauthorized = await handlers.GET(
    new Request("http://localhost/api/characters/stats/Kobold") as any,
    { params: { name: "Kobold" } }
  );
  assert.equal(unauthorized.status, 401);

  const methodNotAllowed = await handlers.POST(
    new Request("http://localhost/api/characters/stats/Kobold", {
      method: "POST",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Kobold" } }
  );
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("Allow"), "GET");
});

test("characters stats route validates name and missing character", async () => {
  const handlers = buildHandlers({
    getCharacterStatsByName: async () => null,
  });

  const missingName = await handlers.GET(
    new Request("http://localhost/api/characters/stats", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: {} }
  );
  assert.equal(missingName.status, 400);
  assert.deepEqual(await missingName.json(), {
    message: "Character name must be a string.",
  });

  const missingCharacter = await handlers.GET(
    new Request("http://localhost/api/characters/stats/Kobold", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Kobold" } }
  );
  assert.equal(missingCharacter.status, 404);
  assert.deepEqual(await missingCharacter.json(), { message: "Character not found" });
});

test("characters stats route returns 500 on dependency failure", async () => {
  const handlers = buildHandlers({
    getCharacterStatsByName: async () => {
      throw new Error("boom");
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters/stats/Kobold", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Kobold" } }
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Error fetching character stats" });
});
