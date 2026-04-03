import test from "node:test";
import assert from "node:assert/strict";
import { createUserByClerkIdRouteHandlers } from "../src/server/userByClerkIdRouteHandlers";

test("users route GET returns combined user", async () => {
  const handlers = createUserByClerkIdRouteHandlers({
    deps: {
      getUserByClerkUserId: async () => ({ id: 4, clerkUserId: "u_1", name: "User" }),
      getClerkUsername: async () => "u1name",
      updateUser: async () => ({}),
      deleteUser: async () => {},
    },
  });

  const response = await handlers.GET(new Request("http://localhost/api/users/u_1") as any, {
    params: { clerkUserId: "u_1" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: 4,
    clerkUserId: "u_1",
    name: "User",
    username: "u1name",
  });
});

test("users route POST returns 405 with allow header", async () => {
  const handlers = createUserByClerkIdRouteHandlers({
    deps: {
      getUserByClerkUserId: async () => null,
      getClerkUsername: async () => null,
      updateUser: async () => ({}),
      deleteUser: async () => {},
    },
  });

  const response = await handlers.POST(new Request("http://localhost/api/users/u_1") as any, {
    params: { clerkUserId: "u_1" },
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, PUT, DELETE");
});

test("users route PUT returns 400 for missing id query", async () => {
  const handlers = createUserByClerkIdRouteHandlers({
    deps: {
      getUserByClerkUserId: async () => null,
      getClerkUsername: async () => null,
      updateUser: async () => ({}),
      deleteUser: async () => {},
    },
  });

  const response = await handlers.PUT(new Request("http://localhost/api/users/u_1", {
    method: "PUT",
    body: JSON.stringify({ name: "x" }),
  }) as any, {
    params: { clerkUserId: "u_1" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Invalid id." });
});
