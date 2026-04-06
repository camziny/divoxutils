import test from "node:test";
import assert from "node:assert/strict";
import { createUsersRouteHandlers } from "../src/server/usersRouteHandlers";

test("users GET prefers characterName over name and sets cache header", async () => {
  const handlers = createUsersRouteHandlers({
    deps: {
      getUsers: async () => [],
      getUserByName: async () => [{ id: 1, name: "Exact" }],
      getUsersByPartialName: async () => [{ id: 2, name: "Partial" }],
      getUserByCharacterName: async () => [{ id: 3, name: "ByCharacter" }],
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/users?name=Exact&characterName=Char") as any
  );

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("Cache-Control"),
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  assert.deepEqual(await response.json(), [{ id: 3, name: "ByCharacter" }]);
});

test("users GET falls back from exact to partial search", async () => {
  const handlers = createUsersRouteHandlers({
    deps: {
      getUsers: async () => [],
      getUserByName: async () => [],
      getUsersByPartialName: async () => [{ id: 2, name: "Partial" }],
      getUserByCharacterName: async () => [],
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/users?name=Par") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: 2, name: "Partial" }]);
});

test("users POST returns 405 with allow header", async () => {
  const handlers = createUsersRouteHandlers({
    deps: {
      getUsers: async () => [],
      getUserByName: async () => [],
      getUsersByPartialName: async () => [],
      getUserByCharacterName: async () => [],
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/users", { method: "POST" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
