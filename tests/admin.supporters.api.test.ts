import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminSupportersListHandler,
  createAdminSupportersSearchHandler,
  createAdminSupportersUpdateHandler,
} from "../src/server/adminSupportersPagesHandlers";

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
  body?: Record<string, unknown>;
}) {
  return {
    method: options?.method ?? "GET",
    query: options?.query ?? {},
    body: options?.body ?? {},
    headers: {},
  } as any;
}

test("supporters list returns 405 for non-GET", async () => {
  const handler = createAdminSupportersListHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findSupporters: async () => [],
  });
  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("supporters search returns empty users for short query", async () => {
  let findCalled = false;
  const handler = createAdminSupportersSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findUsers: async () => {
      findCalled = true;
      return [];
    },
  });
  const req = createMockRequest({ method: "GET", query: { q: "a" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { users: [] });
  assert.equal(findCalled, false);
});

test("supporters search trims query before lookup", async () => {
  let captured = "";
  const handler = createAdminSupportersSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findUsers: async (query) => {
      captured = query;
      return [];
    },
  });
  const req = createMockRequest({
    method: "GET",
    query: { q: "  playerOne  " },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(captured, "playerOne");
});

test("supporters update validates positive addAmount", async () => {
  let applyCalled = false;
  const handler = createAdminSupportersUpdateHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    applySupporterContribution: async () => {
      applyCalled = true;
      return { supporterAmount: 10, supporterTier: 0 };
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_1", addAmount: 0 },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "addAmount must be a positive number." });
  assert.equal(applyCalled, false);
});

test("supporters update applies amount and tier thresholds", async () => {
  let captured: { clerkUserId: string; addAmount: number } | null = null;
  const handler = createAdminSupportersUpdateHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    applySupporterContribution: async (args) => {
      captured = args;
      return { supporterAmount: 55, supporterTier: 2 };
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "  clerk_1  ", addAmount: 25 },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    clerkUserId: "clerk_1",
    addAmount: 25,
  });
  assert.deepEqual(res.body, {
    success: true,
    clerkUserId: "clerk_1",
    supporterAmount: 55,
    supporterTier: 2,
  });
});

test("supporters update returns 404 when user does not exist", async () => {
  const handler = createAdminSupportersUpdateHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    applySupporterContribution: async () => null,
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "missing", addAmount: 10 },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found." });
});
