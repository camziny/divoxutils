import test from "node:test";
import assert from "node:assert/strict";
import { createCharactersByUserIdRouteHandlers } from "../src/server/charactersByUserIdRouteHandlers";

test("charactersByUser GET returns 400 for missing id", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: {},
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "User ID must be a string." });
});

test("charactersByUser GET returns 404 when empty", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [],
    },
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "user_1" },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    message: "No characters found for this user.",
  });
});

test("charactersByUser GET returns characters", async () => {
  const handlers = createCharactersByUserIdRouteHandlers({
    deps: {
      getUserCharactersByUserId: async () => [{ characterId: 8 }],
    },
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
