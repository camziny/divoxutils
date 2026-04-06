import test from "node:test";
import assert from "node:assert/strict";
import { createUserCharactersRouteHandlers } from "../src/server/userCharactersRouteHandlers";

test("userCharacters GET returns 401 without Clerk auth", async () => {
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => null,
      getUserCharacters: async () => [],
      createUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/userCharacters") as any
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("userCharacters GET returns list for auth user when query missing", async () => {
  const requestedUserIds: string[] = [];
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getUserCharacters: async (clerkUserId) => {
        requestedUserIds.push(clerkUserId);
        return [{ characterId: 9 }];
      },
      createUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/userCharacters") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(requestedUserIds, ["user_1"]);
  assert.deepEqual(await response.json(), [{ characterId: 9 }]);
});

test("userCharacters GET returns 403 for cross-user access", async () => {
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getUserCharacters: async () => [{ characterId: 9 }],
      createUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/userCharacters?clerkUserId=user_2") as any
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: "Forbidden" });
});

test("userCharacters POST returns 401 without Clerk auth", async () => {
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => null,
      getUserCharacters: async () => [],
      createUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/userCharacters", {
      method: "POST",
      body: JSON.stringify({ characterId: "10" }),
      headers: { "Content-Type": "application/json" },
    }) as any
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("userCharacters POST creates character link", async () => {
  const created: Array<{ clerkUserId: string; characterId: unknown }> = [];
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getUserCharacters: async () => [],
      createUserCharacter: async (data) => {
        created.push(data);
        return { id: 1 };
      },
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/userCharacters", {
      method: "POST",
      body: JSON.stringify({ characterId: "10" }),
      headers: { "Content-Type": "application/json" },
    }) as any
  );

  assert.equal(response.status, 201);
  assert.deepEqual(created, [{ clerkUserId: "user_1", characterId: "10" }]);
  assert.deepEqual(await response.json(), { id: 1 });
});

test("userCharacters DELETE returns 405 with allow header", async () => {
  const handlers = createUserCharactersRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getUserCharacters: async () => [],
      createUserCharacter: async () => ({}),
    },
  });

  const response = await handlers.DELETE(
    new Request("http://localhost/api/userCharacters", { method: "DELETE" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, POST");
});
