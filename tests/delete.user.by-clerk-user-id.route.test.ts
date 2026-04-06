import test from "node:test";
import assert from "node:assert/strict";
import { createDeleteUserByClerkUserIdRouteHandlers } from "../src/server/deleteUserByClerkUserIdRouteHandlers";

function buildHandlers(
  overrides?: Partial<{
    getUserByClerkUserId: (clerkUserId: string) => Promise<unknown | null>;
    deleteUserByClerkUserId: (clerkUserId: string) => Promise<unknown>;
  }>
) {
  return createDeleteUserByClerkUserIdRouteHandlers({
    apiSecret: "secret",
    deps: {
      getUserByClerkUserId:
        overrides?.getUserByClerkUserId ?? (async () => ({ id: 1, clerkUserId: "u_1" })),
      deleteUserByClerkUserId: overrides?.deleteUserByClerkUserId ?? (async () => ({})),
    },
  });
}

test("delete user route DELETE returns 204 for existing user", async () => {
  const deleted: string[] = [];
  const handlers = buildHandlers({
    deleteUserByClerkUserId: async (clerkUserId) => {
      deleted.push(clerkUserId);
      return {};
    },
  });

  const response = await handlers.DELETE(
    new Request("http://localhost/api/delete/user/u_1", {
      method: "DELETE",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { clerkUserId: "u_1" } }
  );

  assert.equal(response.status, 204);
  assert.deepEqual(deleted, ["u_1"]);
});

test("delete user route validates auth and method", async () => {
  const handlers = buildHandlers();

  const unauthorized = await handlers.DELETE(
    new Request("http://localhost/api/delete/user/u_1", {
      method: "DELETE",
    }) as any,
    { params: { clerkUserId: "u_1" } }
  );
  assert.equal(unauthorized.status, 401);

  const methodNotAllowed = await handlers.GET(
    new Request("http://localhost/api/delete/user/u_1", {
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { clerkUserId: "u_1" } }
  );
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("Allow"), "DELETE");
});

test("delete user route validates params and not found", async () => {
  const handlers = buildHandlers({
    getUserByClerkUserId: async () => null,
  });

  const missingParam = await handlers.DELETE(
    new Request("http://localhost/api/delete/user", {
      method: "DELETE",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: {} }
  );
  assert.equal(missingParam.status, 400);
  assert.deepEqual(await missingParam.json(), { message: "Invalid clerkUserId" });

  const missingUser = await handlers.DELETE(
    new Request("http://localhost/api/delete/user/u_1", {
      method: "DELETE",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { clerkUserId: "u_1" } }
  );
  assert.equal(missingUser.status, 404);
  assert.deepEqual(await missingUser.json(), { message: "User not found" });
});

test("delete user route returns 500 on dependency failure", async () => {
  const handlers = buildHandlers({
    deleteUserByClerkUserId: async () => {
      throw new Error("boom");
    },
  });

  const response = await handlers.DELETE(
    new Request("http://localhost/api/delete/user/u_1", {
      method: "DELETE",
      headers: { "x-api-key": "secret" },
    }) as any,
    { params: { clerkUserId: "u_1" } }
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "boom" });
});
