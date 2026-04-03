import test from "node:test";
import assert from "node:assert/strict";
import { createRestoreDraftHandler } from "../src/server/adminDraftsRouteHandlers";

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
  body?: Record<string, unknown>;
}) {
  return {
    method: options?.method ?? "POST",
    body: options?.body ?? {},
    query: {},
    headers: {},
  } as any;
}

test("restore draft API rejects missing shortId", async () => {
  const handler = createRestoreDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    restoreDraft: async () => ({}),
  });
  const req = createMockRequest({ method: "POST", body: { shortId: "  " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "shortId is required." });
});

test("restore draft API calls mutation with trimmed shortId", async () => {
  let captured: any = null;
  const handler = createRestoreDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    restoreDraft: async (args) => {
      captured = args;
      return { shortId: args.shortId, status: "setup" };
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { shortId: "  abc123  " },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    shortId: "abc123",
    restoredByClerkUserId: "admin_1",
  });
  assert.deepEqual(res.body, {
    success: true,
    result: { shortId: "abc123", status: "setup" },
  });
});

test("restore draft API rejects non-admin requests", async () => {
  let mutationCalled = false;
  const handler = createRestoreDraftHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    restoreDraft: async () => {
      mutationCalled = true;
      return {};
    },
  });
  const req = createMockRequest({ method: "POST", body: { shortId: "abc123" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
  assert.equal(mutationCalled, false);
});
