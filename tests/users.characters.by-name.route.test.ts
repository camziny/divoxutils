import test from "node:test";
import assert from "node:assert/strict";
import { createUsersCharactersByNameRouteHandlers } from "../src/server/usersCharactersByNameRouteHandlers";

function buildHandlers(
  overrides?: Partial<{
    getAllUserNames: () => Promise<string[]>;
    getUserCharactersByUserName: (userName: string) => Promise<
      Array<{
        characterName: string;
        className: string;
        totalRealmPoints: number;
        realm: string;
        heraldName: string | null;
      }>
    >;
  }>
) {
  return createUsersCharactersByNameRouteHandlers({
    apiSecret: "secret",
    deps: {
      getAllUserNames: overrides?.getAllUserNames ?? (async () => ["Alice"]),
      getUserCharactersByUserName:
        overrides?.getUserCharactersByUserName ??
        (async () => [
          {
            characterName: "A",
            className: "Warrior",
            totalRealmPoints: 2000,
            realm: "Midgard",
            heraldName: "A",
          },
          {
            characterName: "B",
            className: "Healer",
            totalRealmPoints: 1500,
            realm: "Midgard",
            heraldName: "B",
          },
        ]),
    },
  });
}

test("users characters route GET returns filtered payload", async () => {
  const handlers = buildHandlers();

  const response = await handlers.GET(
    new Request(
      "http://localhost/api/users/characters/Alic?realm=mid&classType=tank",
      {
        headers: { "x-api-key": "secret" },
      }
    ) as any,
    { params: { name: "Alic" } }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: "Alice",
    characters: [
      {
        characterName: "A",
        className: "Warrior",
        heraldName: "A",
        formattedRank: "1L6",
      },
    ],
  });
});

test("users characters route enforces api key", async () => {
  const handlers = buildHandlers();

  const response = await handlers.GET(
    new Request("http://localhost/api/users/characters/Alice") as any,
    { params: { name: "Alice" } }
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: "Invalid or missing API key." });
});

test("users characters route validates params and filters", async () => {
  const handlers = buildHandlers();

  const missingName = await handlers.GET(
    new Request("http://localhost/api/users/characters", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: {} }
  );
  assert.equal(missingName.status, 400);
  assert.deepEqual(await missingName.json(), { message: "User name must be a string." });

  const invalidClassType = await handlers.GET(
    new Request("http://localhost/api/users/characters/Alice?classType=invalid", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(invalidClassType.status, 400);
  assert.deepEqual(await invalidClassType.json(), { message: "Invalid classType." });
});

test("users characters route returns not found and method guard", async () => {
  const handlers = buildHandlers({
    getAllUserNames: async () => ["Zed"],
  });

  const notFound = await handlers.GET(
    new Request("http://localhost/api/users/characters/Alice", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(notFound.status, 404);
  assert.deepEqual(await notFound.json(), { message: "User Alice not found" });

  const methodNotAllowed = await handlers.POST(
    new Request("http://localhost/api/users/characters/Alice", {
      method: "POST",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("Allow"), "GET");
});

test("users characters route returns 404 when no characters remain after filtering", async () => {
  const handlers = buildHandlers({
    getUserCharactersByUserName: async () => [
      {
        characterName: "CasterOnly",
        className: "Warlock",
        totalRealmPoints: 1000,
        realm: "Midgard",
        heraldName: "CasterOnly",
      },
    ],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/users/characters/Alice?classType=tank", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "No characters found for this user." });
});

test("users characters route returns 500 on dependency failure", async () => {
  const handlers = buildHandlers({
    getAllUserNames: async () => {
      throw new Error("boom");
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/users/characters/Alice", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { name: "Alice" } }
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "boom" });
});
