import test from "node:test";
import assert from "node:assert/strict";
import { createCharactersCollectionRouteHandlers } from "../src/server/api/charactersCollectionRouteHandlers";

test("characters GET returns 401 without clerk user", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => null,
    findUserByClerkId: async () => ({ id: 1 }),
    findUserById: async () => ({ id: 1 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters") as any
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("characters GET returns 404 when user missing in database", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => null,
    findUserById: async () => ({ id: 1 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters") as any
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: "User not found in our database.",
  });
});

test("characters GET returns character list", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => [{ id: 1, webId: "w" }],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: 1, webId: "w" }]);
});

test("characters GET returns 500 when getCharacters throws", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => {
      throw new Error("db read failed");
    },
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters") as any
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "db read failed" });
});

test("characters POST returns 401 without clerk user", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => null,
    findUserByClerkId: async () => ({ id: 1 }),
    findUserById: async () => ({ id: 1 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characters: [] }),
    }) as any
  );

  assert.equal(response.status, 401);
});

test("characters POST returns 500 when characters is not an array", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characters: "bad" }),
    }) as any
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    message: "Expected an array of character details.",
  });
});

test("characters POST adds characters and returns 201", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => [],
    addCharactersToUserList: async (characters, userId) => {
      assert.deepEqual(characters, ["a", "b"]);
      assert.equal(userId, 9);
      return [1, 2];
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characters: ["a", "b"] }),
    }) as any
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { addedCharacters: [1, 2] });
});

test("characters GET rejects non-GET method", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/characters", { method: "DELETE" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("characters POST rejects non-POST method", async () => {
  const handlers = createCharactersCollectionRouteHandlers({
    getClerkUserId: async () => "user_1",
    findUserByClerkId: async () => ({ id: 9 }),
    findUserById: async () => ({ id: 9 }),
    getCharacters: async () => [],
    addCharactersToUserList: async () => [],
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/characters", { method: "GET" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});
