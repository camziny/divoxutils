import test from "node:test";
import assert from "node:assert/strict";
import { createAdminIdentityBackfillRouteHandlers } from "../src/server/adminIdentityBackfillRouteHandlers";

test("identity backfill route rejects non-POST requests", async () => {
  const handlers = createAdminIdentityBackfillRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => [],
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/admin/identity-linking/backfill", {
      method: "GET",
    }) as any
  );
  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("identity backfill route rejects unauthorized requests", async () => {
  const handlers = createAdminIdentityBackfillRouteHandlers({
    getAuthUserId: async () => null,
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => [],
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/identity-linking/backfill", {
      method: "POST",
      body: JSON.stringify({}),
    }) as any
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("identity backfill route paginates and applies safe matches", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const users = [
    { id: 1, clerkUserId: "u1" },
    { id: 2, clerkUserId: "u2" },
    { id: 3, clerkUserId: "u3" },
  ];
  const handlers = createAdminIdentityBackfillRouteHandlers({
    getAuthUserId: async () => "admin_1",
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

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/identity-linking/backfill", {
      method: "POST",
      body: JSON.stringify({}),
    }) as any
  );

  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(upsertCalls.length, 1);
  assert.deepEqual(body.batch, {
    scannedUsers: 3,
    linked: 1,
    skippedNoDiscord: 1,
    skippedMissingClerkUser: 0,
    skippedAlreadyLinkedToOther: 1,
    skippedErrors: 0,
    errors: [],
  });
  assert.deepEqual(body.progress, { hasMore: false, nextCursor: null });
});

test("identity backfill route rejects invalid JSON body", async () => {
  let listCalled = false;
  let upsertCalled = false;
  const handlers = createAdminIdentityBackfillRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    listUnlinkedLocalUsers: async () => {
      listCalled = true;
      return [];
    },
    getDiscordUserIdFromClerk: async () => null,
    findLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => {
      upsertCalled = true;
      return {};
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/identity-linking/backfill", {
      method: "POST",
      body: "{",
      headers: {
        "content-type": "application/json",
      },
    }) as any
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body." });
  assert.equal(listCalled, false);
  assert.equal(upsertCalled, false);
});
