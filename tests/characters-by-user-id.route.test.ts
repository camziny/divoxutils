import test from "node:test";
import assert from "node:assert/strict";
import { createCharactersByUserIdRouteHandlers } from "../src/server/charactersByUserIdRouteHandlers";

test("charactersByUser GET returns 400 for missing id", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
    getAuthUserId: async () => "user_1",
    isAdminClerkUserId: () => false,
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: {},
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "User ID must be a string." });
});

test("charactersByUser GET returns 403 for a different user", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
    getAuthUserId: async () => "user_2",
    isAdminClerkUserId: () => false,
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "user_1" },
  });

  assert.equal(response.status, 403);
});

test("charactersByUser GET returns 404 when empty", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
    getAuthUserId: async () => "user_1",
    isAdminClerkUserId: () => false,
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "user_1" },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    message: "No characters found for this user.",
  });
});

test("charactersByUser GET returns characters for the owner", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [{ characterId: 8 }],
    },
    getAuthUserId: async () => "user_1",
    isAdminClerkUserId: () => false,
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "user_1" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ characterId: 8 }]);
});

test("charactersByUser GET returns characters for an admin viewer", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [{ characterId: 8 }],
    },
    getAuthUserId: async () => "admin_1",
    isAdminClerkUserId: () => true,
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "user_1" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ characterId: 8 }]);
});

test("charactersByUser POST returns 405 with allow header", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
    getAuthUserId: async () => "user_1",
    isAdminClerkUserId: () => false,
  });

  const response = await handlers.POST(
    new Request("http://localhost", { method: "POST" }) as any,
    {
      params: { id: "user_1" },
    }
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
