import test from "node:test";
import assert from "node:assert/strict";
import { createUserByClerkIdHandler } from "../src/server/userByClerkIdPagesHandler";

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
  body?: unknown;
}) {
  return {
    method: options?.method ?? "GET",
    query: options?.query ?? {},
    body: options?.body ?? {},
    headers: {},
  } as any;
}

test("users/[clerkUserId] GET returns user with clerk username", async () => {
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => ({ id: 1, clerkUserId: "user_1", name: "Cam" }),
    getClerkUsername: async () => "camz",
    updateUser: async () => ({}),
    deleteUser: async () => {},
  });
  const req = createMockRequest({
    method: "GET",
    query: { clerkUserId: "user_1" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    id: 1,
    clerkUserId: "user_1",
    name: "Cam",
    username: "camz",
  });
});

test("users/[clerkUserId] GET returns 404 when user missing", async () => {
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async () => ({}),
    deleteUser: async () => {},
  });
  const req = createMockRequest({
    method: "GET",
    query: { clerkUserId: "missing" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: "User not found" });
});

test("users/[clerkUserId] PUT updates by query id", async () => {
  let updatedId = 0;
  let updatedBody: unknown = null;
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async (id, body) => {
      updatedId = id;
      updatedBody = body;
      return { id, ...(body as Record<string, unknown>) };
    },
    deleteUser: async () => {},
  });
  const req = createMockRequest({
    method: "PUT",
    query: { clerkUserId: "user_1", id: "42" },
    body: { name: "Updated" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(updatedId, 42);
  assert.deepEqual(updatedBody, { name: "Updated" });
});

test("users/[clerkUserId] PUT returns 400 for missing id", async () => {
  let updatedCalled = false;
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async () => {
      updatedCalled = true;
      return {};
    },
    deleteUser: async () => {},
  });
  const req = createMockRequest({
    method: "PUT",
    query: { clerkUserId: "user_1" },
    body: { name: "Updated" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: "Invalid id." });
  assert.equal(updatedCalled, false);
});

test("users/[clerkUserId] DELETE returns 204", async () => {
  let deletedId = 0;
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async () => ({}),
    deleteUser: async (id) => {
      deletedId = id;
    },
  });
  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: "user_1", id: "77" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 204);
  assert.equal(deletedId, 77);
});

test("users/[clerkUserId] DELETE returns 400 for invalid id", async () => {
  let deleteCalled = false;
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async () => ({}),
    deleteUser: async () => {
      deleteCalled = true;
    },
  });
  const req = createMockRequest({
    method: "DELETE",
    query: { clerkUserId: "user_1", id: "0" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: "Invalid id." });
  assert.equal(deleteCalled, false);
});

test("users/[clerkUserId] rejects unsupported methods", async () => {
  const handler = createUserByClerkIdHandler({
    getUserByClerkUserId: async () => null,
    getClerkUsername: async () => null,
    updateUser: async () => ({}),
    deleteUser: async () => {},
  });
  const req = createMockRequest({
    method: "POST",
    query: { clerkUserId: "user_1" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, PUT, DELETE");
});
