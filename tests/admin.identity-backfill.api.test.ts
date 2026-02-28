import test from "node:test";
import assert from "node:assert/strict";
import { createAdminIdentityBackfillHandler } from "../pages/api/admin/identity-linking/backfill";

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

test("identity backfill rejects non-POST requests", async () => {
  const handler = createAdminIdentityBackfillHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => [],
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("identity backfill rejects unauthorized requests", async () => {
  const handler = createAdminIdentityBackfillHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => [],
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("identity backfill rejects non-admin requests", async () => {
  const handler = createAdminIdentityBackfillHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    listUnlinkedLocalUsers: async () => [],
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("identity backfill paginates and applies safe matches", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const users = [
    { id: 1, clerkUserId: "u1" },
    { id: 2, clerkUserId: "u2" },
    { id: 3, clerkUserId: "u3" },
  ];
  const handler = createAdminIdentityBackfillHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async ({ afterId }) =>
      users.filter((u) => (afterId ? u.id > afterId : true)),
    getDiscordUserIdFromClerk: async (clerkUserId) => {
      if (clerkUserId === "u1") return "discord_1";
      if (clerkUserId === "u2") return null;
      return "discord_3";
    },
    findLinkByProviderUserId: async (_provider, providerUserId) => {
      if (providerUserId === "discord_3") return { clerkUserId: "someone_else" };
      return null;
    },
    upsertIdentityLink: async (data) => {
      upsertCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({ body: {} });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(upsertCalls.length, 1);
  assert.deepEqual(res.body.batch, {
    scannedUsers: 3,
    linked: 1,
    skippedNoDiscord: 1,
    skippedMissingClerkUser: 0,
    skippedAlreadyLinkedToOther: 1,
    skippedErrors: 0,
    errors: [],
  });
  assert.deepEqual(res.body.progress, { hasMore: false, nextCursor: null });
});

test("identity backfill marks missing clerk users separately", async () => {
  const handler = createAdminIdentityBackfillHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => [{ id: 1, clerkUserId: "u1" }],
    getDiscordUserIdFromClerk: async () => {
      const error = new Error("Not Found");
      throw error;
    },
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({ body: {} });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.batch.skippedMissingClerkUser, 1);
  assert.equal(res.body.batch.skippedErrors, 0);
});
