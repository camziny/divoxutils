import test from "node:test";
import assert from "node:assert/strict";
import { createDiscordStatusHandler } from "../pages/api/identity/discord-status";

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

function createMockRequest(method = "GET") {
  return {
    method,
    query: {},
    body: {},
    headers: {},
  } as any;
}

test("discord-status rejects non-GET requests", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => "user_1",
    findIdentityLink: async () => null,
    findPendingClaim: async () => null,
    hasDraftRowsForDiscordUserId: async () => false,
  });
  const req = createMockRequest("POST");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("discord-status rejects unauthenticated requests", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => null,
    findIdentityLink: async () => null,
    findPendingClaim: async () => null,
    hasDraftRowsForDiscordUserId: async () => false,
  });
  const req = createMockRequest("GET");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("discord-status returns linked state when user is already linked", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => "user_1",
    findIdentityLink: async () => ({ providerUserId: "12345", status: "linked" }),
    findPendingClaim: async () => null,
    hasDraftRowsForDiscordUserId: async () => true,
  });
  const req = createMockRequest("GET");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    linked: true,
    providerUserId: "12345",
    status: "linked",
    hasAnyDraftRowsForLinkedId: true,
    possibleMismatch: false,
  });
});

test("discord-status keeps mismatch false when linked id has no draft rows", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => "user_1",
    findIdentityLink: async () => ({ providerUserId: "12345", status: "linked" }),
    findPendingClaim: async () => null,
    hasDraftRowsForDiscordUserId: async () => false,
  });
  const req = createMockRequest("GET");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    linked: true,
    providerUserId: "12345",
    status: "linked",
    hasAnyDraftRowsForLinkedId: false,
    possibleMismatch: false,
  });
});

test("discord-status returns pending state when user has pending claim", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => "user_1",
    findIdentityLink: async () => null,
    findPendingClaim: async () => ({ providerUserId: "777", status: "pending" }),
    hasDraftRowsForDiscordUserId: async () => false,
  });
  const req = createMockRequest("GET");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    linked: false,
    pendingClaim: true,
    providerUserId: "777",
  });
});

test("discord-status returns unlinked state when user has no link and no claim", async () => {
  const handler = createDiscordStatusHandler({
    getAuthUserId: () => "user_1",
    findIdentityLink: async () => null,
    findPendingClaim: async () => null,
    hasDraftRowsForDiscordUserId: async () => false,
  });
  const req = createMockRequest("GET");
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    linked: false,
    pendingClaim: false,
  });
});
