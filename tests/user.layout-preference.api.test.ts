import test from "node:test";
import assert from "node:assert/strict";
import { createLayoutPreferenceHandler } from "../pages/api/user/preferences/layout";

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
  };
  return res;
}

function createMockRequest({
  method = "GET",
  body = {},
}: {
  method?: string;
  body?: Record<string, unknown>;
} = {}) {
  return {
    method,
    body,
    headers: {},
    query: {},
  } as any;
}

test("layout preference rejects unauthenticated requests", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => null,
    findUserLayout: async () => null,
    findUserByClerkId: async () => null,
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("layout preference rejects unsupported methods", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => null,
    findUserByClerkId: async () => null,
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, PUT");
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("layout preference GET returns table fallback for unknown db value", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => ({ preferredCharacterListLayout: "legacy-view" }),
    findUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { layout: "table" });
});

test("layout preference GET returns 404 when user missing", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => null,
    findUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found" });
});

test("layout preference PUT validates layout value", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
    findUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({
    method: "PUT",
    body: { layout: "not-valid" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid layout" });
});

test("layout preference PUT returns 404 when user missing", async () => {
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
    findUserByClerkId: async () => null,
    updateUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
  });
  const req = createMockRequest({
    method: "PUT",
    body: { layout: "realm-grid" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found" });
});

test("layout preference PUT saves and returns layout", async () => {
  let savedLayout: string | null = null;
  const handler = createLayoutPreferenceHandler({
    getAuthUserId: () => "user_1",
    findUserLayout: async () => ({ preferredCharacterListLayout: "table" }),
    findUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    updateUserLayout: async (_userId, layout) => {
      savedLayout = layout;
      return { preferredCharacterListLayout: layout };
    },
  });
  const req = createMockRequest({
    method: "PUT",
    body: { layout: "realm-grid" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(savedLayout, "realm-grid");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { layout: "realm-grid" });
});
