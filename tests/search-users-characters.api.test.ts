import test from "node:test";
import assert from "node:assert/strict";
import { createSearchUsersAndCharactersHandler } from "../src/server/searchUsersAndCharactersPagesHandler";
import { handleSearchUsersAndCharactersApi } from "../src/server/searchUsersAndCharactersApi";

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
}) {
  return {
    method: options?.method ?? "GET",
    query: options?.query ?? {},
    headers: {},
  } as any;
}

function makeCharacter(overrides?: { heraldName?: string | null; characterName?: string }) {
  return {
    characterName: overrides?.characterName ?? "SomeCharacter",
    heraldName: overrides?.heraldName ?? "SomeHerald",
    className: "Armsman",
    heraldClassName: "Armsman",
    totalRealmPoints: 1,
  };
}

test("search users and characters returns 405 for non-GET", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [],
  });
  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers.Allow, ["GET"]);
});

test("search users and characters validates name query", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [],
  });
  const req = createMockRequest({ query: {} });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: "Name must be provided and must be a string",
  });
});

test("search users and characters returns empty users for short query", async () => {
  let called = false;
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => {
      called = true;
      return [];
    },
  });
  const req = createMockRequest({ query: { name: "  ke " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { users: [] });
  assert.equal(called, false);
});

test("search users and characters normalizes query before lookup", async () => {
  let capturedQuery = "";
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async ({ normalizedQuery }) => {
      capturedQuery = normalizedQuery;
      return [];
    },
  });
  const req = createMockRequest({ query: { name: "  KeNCo  " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(capturedQuery, "kenco");
});

test("search users and characters ranks exact, prefix, then contains", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [
      {
        id: 10,
        clerkUserId: "u_exact_character",
        name: "alpha",
        supporterTier: 0,
        hideProfile: false,
        characters: [
          { character: makeCharacter({ heraldName: "xkenx", characterName: "XKenX" }) },
          { character: makeCharacter({ heraldName: "ken", characterName: "Ken" }) },
          { character: makeCharacter({ heraldName: "kendra", characterName: "Kendra" }) },
          { character: makeCharacter({ heraldName: null, characterName: "NullHerald" }) },
        ],
      },
      {
        id: 20,
        clerkUserId: "u_prefix_user",
        name: "kennyUser",
        supporterTier: 0,
        hideProfile: false,
        characters: [],
      },
      {
        id: 30,
        clerkUserId: "u_contains_user",
        name: "xkenxUser",
        supporterTier: 0,
        hideProfile: false,
        characters: [],
      },
      {
        id: 40,
        clerkUserId: "u_filtered_out",
        name: "nomatch",
        supporterTier: 0,
        hideProfile: false,
        characters: [{ character: makeCharacter({ heraldName: null }) }],
      },
    ],
  });
  const req = createMockRequest({ query: { name: "Ken" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const users = (res.body as any).users;
  assert.equal(users.length, 3);
  assert.deepEqual(
    users.map((u: any) => u.id),
    [10, 20, 30]
  );
  assert.deepEqual(
    users[0].characters.map((c: any) => c.heraldName),
    ["ken", "kendra", "xkenx"]
  );
});

test("search users and characters supports user-name-only match with zero characters", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [
      {
        id: 50,
        clerkUserId: "u_k3nco",
        name: "k3nco",
        supporterTier: 0,
        hideProfile: false,
        characters: [{ character: makeCharacter({ heraldName: null, characterName: "kenco" }) }],
      },
    ],
  });
  const req = createMockRequest({ query: { name: "k3n" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    users: [
      {
        id: 50,
        clerkUserId: "u_k3nco",
        name: "k3nco",
        supporterTier: 0,
        isOwnHiddenProfile: false,
        characters: [],
      },
    ],
  });
});

test("search users and characters omits character details for a hidden profile but still matches by name", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [
      {
        id: 70,
        clerkUserId: "u_hidden",
        name: "kenhidden",
        supporterTier: 0,
        hideProfile: true,
        characters: [{ character: makeCharacter({ heraldName: "ken", characterName: "Ken" }) }],
      },
    ],
  });
  const req = createMockRequest({ query: { name: "ken" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    users: [
      {
        id: 70,
        clerkUserId: "u_hidden",
        name: "kenhidden",
        supporterTier: 0,
        isOwnHiddenProfile: false,
        characters: [],
      },
    ],
  });
});

test("search users and characters shows characters for the viewer's own hidden profile with a marker", async () => {
  const result = await handleSearchUsersAndCharactersApi(
    { method: "GET", nameQuery: "ken", viewerClerkUserId: "u_hidden" },
    {
      findUsers: async () => [
        {
          id: 70,
          clerkUserId: "u_hidden",
          name: "kenhidden",
          supporterTier: 0,
          hideProfile: true,
          characters: [{ character: makeCharacter({ heraldName: "ken", characterName: "Ken" }) }],
        },
      ],
    }
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    users: [
      {
        id: 70,
        clerkUserId: "u_hidden",
        name: "kenhidden",
        supporterTier: 0,
        isOwnHiddenProfile: true,
        characters: [
          {
            characterName: "Ken",
            heraldName: "ken",
            className: "Armsman",
            totalRealmPoints: 1,
            heraldClassName: "Armsman",
          },
        ],
      },
    ],
  });
});

test("search users and characters prefers earlier match position in tie", async () => {
  const handler = createSearchUsersAndCharactersHandler({
    findUsers: async () => [
      {
        id: 60,
        clerkUserId: "u_late_match",
        name: "zzzkenco",
        supporterTier: 0,
        hideProfile: false,
        characters: [],
      },
      {
        id: 61,
        clerkUserId: "u_early_match",
        name: "kencozzz",
        supporterTier: 0,
        hideProfile: false,
        characters: [],
      },
      {
        id: 62,
        clerkUserId: "u_middle_match",
        name: "zzkencoz",
        supporterTier: 0,
        hideProfile: false,
        characters: [],
      },
    ],
  });
  const req = createMockRequest({ query: { name: "kenco" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const users = (res.body as any).users;
  assert.deepEqual(
    users.map((u: any) => u.id),
    [61, 62, 60]
  );
});
