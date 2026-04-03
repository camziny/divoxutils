import test from "node:test";
import assert from "node:assert/strict";
import { createUserCharactersByUserIdRouteHandlers } from "../src/server/userCharactersByUserIdRouteHandlers";
import { createUserCharacterRouteHandlers } from "../src/server/userCharacterRouteHandlers";

test("userCharactersByUserId route GET returns mapped payload", async () => {
  const handlers = createUserCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [
        {
          clerkUserId: "user_1",
          character: {
            id: 44,
            webId: "abc",
            characterName: "Char",
            className: "Healer",
            realm: "Midgard",
            previousCharacterName: null,
            totalRealmPoints: 100,
            realmPointsLastWeek: 10,
            totalSoloKills: 1,
            soloKillsLastWeek: 0,
            totalDeaths: 2,
            deathsLastWeek: 0,
            lastUpdated: null,
            nameLastUpdated: null,
            heraldCharacterWebId: "abc",
            heraldName: "Char",
            heraldServerName: "Ywain",
            heraldRealm: 2,
            heraldRace: "Norse",
            heraldClassName: "Healer",
            heraldLevel: 50,
            heraldGuildName: "Guild",
            heraldRealmPoints: 100,
            heraldBountyPoints: 200,
            heraldMasterLevel: "10",
            heraldTotalKills: 11,
            heraldTotalDeaths: 22,
            heraldTotalDeathBlows: 33,
            heraldTotalSoloKills: 44,
            heraldAlbionKills: 1,
            heraldAlbionDeaths: 2,
            heraldAlbionDeathBlows: 3,
            heraldAlbionSoloKills: 4,
            heraldMidgardKills: 5,
            heraldMidgardDeaths: 6,
            heraldMidgardDeathBlows: 7,
            heraldMidgardSoloKills: 8,
            heraldHiberniaKills: 9,
            heraldHiberniaDeaths: 10,
            heraldHiberniaDeathBlows: 11,
            heraldHiberniaSoloKills: 12,
          },
        },
      ],
    },
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { userId: "user_1" },
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("Cache-Control"),
    "private, no-store, no-cache, max-age=0, must-revalidate"
  );
  const body = (await response.json()) as Array<Record<string, unknown>>;
  assert.equal(body.length, 1);
  assert.equal(body[0].id, 44);
});

test("userCharactersByUserId route POST returns 405", async () => {
  const handlers = createUserCharactersByUserIdRouteHandlers({
    deps: { getUserCharactersByUserId: async () => [] },
  });

  const response = await handlers.POST(new Request("http://localhost") as any, {
    params: { userId: "user_1" },
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("userCharacter route DELETE rejects unauthenticated user", async () => {
  const handlers = createUserCharacterRouteHandlers({
    getAuthUserId: async () => null,
    deps: {
      getUserCharacterById: async () => ({ clerkUserId: "user_1", characterId: 9 }),
      deleteUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.DELETE(new Request("http://localhost") as any, {
    params: { clerkUserId: "user_1", characterId: "9" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: "Unauthorized" });
});

test("userCharacter route DELETE removes character for owner", async () => {
  const deleted: Array<{ clerkUserId: string; characterId: number }> = [];
  const handlers = createUserCharacterRouteHandlers({
    getAuthUserId: async () => "user_1",
    deps: {
      getUserCharacterById: async ({ clerkUserId, characterId }) => ({
        clerkUserId,
        characterId,
      }),
      deleteUserCharacter: async (ids) => {
        deleted.push(ids);
        return {};
      },
    },
  });

  const response = await handlers.DELETE(new Request("http://localhost") as any, {
    params: { clerkUserId: "user_1", characterId: "9" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-cache, no-store, must-revalidate");
  assert.deepEqual(deleted, [{ clerkUserId: "user_1", characterId: 9 }]);
});

test("userCharacter route validates bad characterId", async () => {
  const handlers = createUserCharacterRouteHandlers({
    getAuthUserId: async () => "user_1",
    deps: {
      getUserCharacterById: async () => null,
      deleteUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.DELETE(new Request("http://localhost") as any, {
    params: { clerkUserId: "user_1", characterId: "bad" },
  });

  assert.equal(response.status, 400);
});
