import test from "node:test";
import assert from "node:assert/strict";
import { createAdminDraftsHandler } from "../pages/api/admin/drafts/index";
import { createCancelDraftHandler } from "../pages/api/admin/drafts/cancel";

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

test("admin drafts API returns pending, reviewed, and cancelable data", async () => {
  const handler = createAdminDraftsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listPendingDrafts: async () => [{ shortId: "pending-1" }],
    listReviewedDrafts: async () => [{ shortId: "reviewed-1" }],
    listCancelableDrafts: async () => [{ shortId: "cancel-1" }],
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    pendingDrafts: [{ shortId: "pending-1" }],
    reviewedDrafts: [{ shortId: "reviewed-1" }],
    cancelableDrafts: [{ shortId: "cancel-1" }],
  });
});

test("cancel draft API rejects missing shortId", async () => {
  const handler = createCancelDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    cancelDraft: async () => ({}),
  });
  const req = createMockRequest({ method: "POST", body: { shortId: "  " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "shortId is required." });
});

test("cancel draft API calls mutation with trimmed payload", async () => {
  let captured: any = null;
  const handler = createCancelDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    cancelDraft: async (args) => {
      captured = args;
      return { shortId: args.shortId, status: "cancelled" };
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { shortId: "  abc123  ", reason: "  stale lobby draft  " },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    shortId: "abc123",
    cancelledByClerkUserId: "admin_1",
    reason: "stale lobby draft",
  });
  assert.deepEqual(res.body, {
    success: true,
    result: { shortId: "abc123", status: "cancelled" },
  });
});

test("cancel draft API rejects non-admin requests", async () => {
  let mutationCalled = false;
  const handler = createCancelDraftHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    cancelDraft: async () => {
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

test("cancel draft API surfaces server errors", async () => {
  const handler = createCancelDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    cancelDraft: async () => {
      throw new Error("convex failed");
    },
  });
  const req = createMockRequest({ method: "POST", body: { shortId: "abc123" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "convex failed" });
});
