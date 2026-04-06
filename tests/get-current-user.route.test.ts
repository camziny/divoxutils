import test from "node:test";
import assert from "node:assert/strict";
import { createGetCurrentUserRouteHandlers } from "../src/server/getCurrentUserRouteHandlers";

test("getCurrentUser GET returns 401 without auth user", async () => {
  const handlers = createGetCurrentUserRouteHandlers({
    deps: {
      getAuthUserId: async () => null,
      getClerkUser: async () => null,
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/getCurrentUser") as any
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("getCurrentUser GET returns 200 with user payload", async () => {
  const handlers = createGetCurrentUserRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getClerkUser: async () => ({ id: "user_1" }),
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/getCurrentUser") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "user_1" });
});

test("getCurrentUser POST returns 405 with allow header", async () => {
  const handlers = createGetCurrentUserRouteHandlers({
    deps: {
      getAuthUserId: async () => "user_1",
      getClerkUser: async () => ({ id: "user_1" }),
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/getCurrentUser", { method: "POST" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
