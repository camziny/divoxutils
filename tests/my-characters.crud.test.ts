import test from "node:test";
import assert from "node:assert/strict";
import { createAddCharactersHandler } from "../pages/api/characters/add";
import { createUserCharactersByUserIdHandler } from "../pages/api/userCharactersByUserId/[userId]";
import { createUserCharacterHandler } from "../pages/api/userCharacters/[clerkUserId]/[characterId]";

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    body: undefined as unknown,
    setHeader(key: string, value: unknown) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    end(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function createMockRequest(options?: {
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}) {
  return {
    method: options?.method ?? "GET",
    query: options?.query ?? {},
    body: options?.body ?? {},
    headers: {},
  } as any;
}

test("add handler rejects unauthenticated requests", async () => {
  const handler = createAddCharactersHandler({
    getAuthUserId: () => null,
    findUserByClerkId: async () => null,
    fetchCharacterDetailsByWebId: async () => ({}),
    upsertCharacterFromDetails: async () => ({ id: 1 }),
    upsertUserCharacterLink: async () => ({}),
  });

  const req = createMockRequest({
    method: "POST",
    body: { webIds: ["abc"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("add handler creates links for posted webIds", async () => {
  const requestedWebIds: string[] = [];
  const linkedCharacterIds: number[] = [];
  const handler = createAddCharactersHandler({
    getAuthUserId: () => "user_123",
    findUserByClerkId: async () => ({ id: 77 }),
    fetchCharacterDetailsByWebId: async (webId) => {
      requestedWebIds.push(webId);
      return { webId };
    },
    upsertCharacterFromDetails: async (details) => ({
      id: details.webId === "w1" ? 11 : 12,
    }),
    upsertUserCharacterLink: async (_clerkUserId, characterId) => {
      linkedCharacterIds.push(characterId);
      return {};
    },
  });

  const req = createMockRequest({
    method: "POST",
    body: { webIds: ["w1", "w2"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(requestedWebIds, ["w1", "w2"]);
  assert.deepEqual(linkedCharacterIds, [11, 12]);
  assert.equal(
    res.headers["Cache-Control"],
    "no-cache, no-store, must-revalidate"
  );
});

test("add handler rejects non-POST requests", async () => {
  const handler = createAddCharactersHandler({
    getAuthUserId: () => "user_123",
    findUserByClerkId: async () => ({ id: 1 }),
    fetchCharacterDetailsByWebId: async () => ({}),
    upsertCharacterFromDetails: async () => ({ id: 1 }),
    upsertUserCharacterLink: async () => ({}),
  });

  const req = createMockRequest({
    method: "GET",
    body: { webIds: ["abc"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.match(String((res.body as { error: string }).error), /not allowed/i);
});

test("add handler rejects when webIds is not an array", async () => {
  const handler = createAddCharactersHandler({
    getAuthUserId: () => "user_123",
    findUserByClerkId: async () => ({ id: 1 }),
    fetchCharacterDetailsByWebId: async () => ({}),
    upsertCharacterFromDetails: async () => ({ id: 1 }),
    upsertUserCharacterLink: async () => ({}),
  });

  const req = createMockRequest({
    method: "POST",
    body: { webIds: "abc" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(String((res.body as { error: string }).error), /Expected an array/i);
});

test("add handler returns 404 when local user is missing", async () => {
  const handler = createAddCharactersHandler({
    getAuthUserId: () => "user_123",
    findUserByClerkId: async () => null,
    fetchCharacterDetailsByWebId: async () => ({}),
    upsertCharacterFromDetails: async () => ({ id: 1 }),
    upsertUserCharacterLink: async () => ({}),
  });

  const req = createMockRequest({
    method: "POST",
    body: { webIds: ["w1"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found." });
});

test("add handler returns 500 when upstream fetch fails", async () => {
  const handler = createAddCharactersHandler({
    getAuthUserId: () => "user_123",
    findUserByClerkId: async () => ({ id: 1 }),
    fetchCharacterDetailsByWebId: async () => {
      throw new Error("upstream boom");
    },
    upsertCharacterFromDetails: async () => ({ id: 1 }),
    upsertUserCharacterLink: async () => ({}),
  });

  const req = createMockRequest({
    method: "POST",
    body: { webIds: ["w1"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.match(
    String((res.body as { details: string }).details),
    /upstream boom/i
  );
});

test("userCharactersByUserId handler returns 400 for invalid userId", async () => {
  const handler = createUserCharactersByUserIdHandler({
    getUserCharactersByUserId: async () => [],
  });

  const req = createMockRequest({
    method: "GET",
    query: { userId: ["bad"] },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid userId" });
});

test("userCharactersByUserId handler returns [] and no-store cache header", async () => {
  const handler = createUserCharactersByUserIdHandler({
    getUserCharactersByUserId: async () => [],
  });

  const req = createMockRequest({
    method: "GET",
    query: { userId: "user_123" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, []);
  assert.equal(
    res.headers["Cache-Control"],
    "private, no-store, no-cache, max-age=0, must-revalidate"
  );
});

test("userCharactersByUserId handler maps character payload", async () => {
  const handler = createUserCharactersByUserIdHandler({
    getUserCharactersByUserId: async () => [
      {
        user: { clerkUserId: "user_123" },
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
  });

  const req = createMockRequest({
    method: "GET",
    query: { userId: "user_123" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = res.body as Array<Record<string, unknown>>;
  assert.equal(body.length, 1);
  assert.equal(body[0].id, 44);
  assert.equal(body[0].clerkUserId, "user_123");
  assert.deepEqual(body[0].initialCharacter, {
    id: 44,
    userId: "user_123",
    webId: "abc",
  });
});

test("userCharactersByUserId handler rejects unsupported methods", async () => {
  const handler = createUserCharactersByUserIdHandler({
    getUserCharactersByUserId: async () => [],
  });

  const req = createMockRequest({
    method: "POST",
    query: { userId: "user_123" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
});

test("userCharacter handler deletes existing link", async () => {
  const deletedKeys: Array<{ clerkUserId: string; characterId: number }> = [];
  const handler = createUserCharacterHandler({
    getUserCharacterById: async ({ clerkUserId, characterId }) => ({
      clerkUserId,
      characterId,
    }),
    deleteUserCharacter: async (key) => {
      deletedKeys.push(key);
      return {} as any;
    },
  });

  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: "user_abc", characterId: "14" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(deletedKeys, [{ clerkUserId: "user_abc", characterId: 14 }]);
  assert.equal(
    res.headers["Cache-Control"],
    "no-cache, no-store, must-revalidate"
  );
});

test("userCharacter handler returns 404 when deleting missing link", async () => {
  const handler = createUserCharacterHandler({
    getUserCharacterById: async () => null,
    deleteUserCharacter: async () => ({} as any),
  });

  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: "user_abc", characterId: "14" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.match(String((res.body as { message: string }).message), /not found/i);
});

test("userCharacter handler validates characterId", async () => {
  const handler = createUserCharacterHandler({
    getUserCharacterById: async () => null,
    deleteUserCharacter: async () => ({} as any),
  });

  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: "user_abc", characterId: "bad" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal((res.body as { message: string }).message, "Invalid characterId.");
});

test("userCharacter handler validates clerkUserId shape", async () => {
  const handler = createUserCharacterHandler({
    getUserCharacterById: async () => null,
    deleteUserCharacter: async () => ({} as any),
  });

  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: ["u1", "u2"], characterId: "14" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(
    String((res.body as { message: string }).message),
    /single string/i
  );
});

test("userCharacter handler rejects unsupported methods", async () => {
  const handler = createUserCharacterHandler({
    getUserCharacterById: async () => null,
    deleteUserCharacter: async () => ({} as any),
  });

  const req = createMockRequest({
    method: "PUT",
    query: { clerkUserId: "user_abc", characterId: "14" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
});
