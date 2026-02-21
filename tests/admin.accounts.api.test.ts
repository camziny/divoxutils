import test from "node:test";
import assert from "node:assert/strict";
import { createAdminAccountSearchHandler } from "../pages/api/admin/accounts/search";
import { createAdminAccountDeleteHandler } from "../pages/api/admin/accounts/delete";

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

test("admin account search returns 405 for non-GET", async () => {
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [],
    findClerkUserIdsByDiscordName: async () => [],
    findUsers: async () => [],
  });
  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("admin account search returns 401 when not authenticated", async () => {
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [],
    findClerkUserIdsByDiscordName: async () => [],
    findUsers: async () => [],
  });
  const req = createMockRequest({ query: { q: "abc" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("admin account search returns 403 for non-admin", async () => {
  let linksCalled = false;
  let discordNameCalled = false;
  let usersCalled = false;
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    findDiscordIdentityLinks: async () => {
      linksCalled = true;
      return [];
    },
    findClerkUserIdsByDiscordName: async () => {
      discordNameCalled = true;
      return [];
    },
    findUsers: async () => {
      usersCalled = true;
      return [];
    },
  });
  const req = createMockRequest({ query: { q: "abc" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
  assert.equal(linksCalled, false);
  assert.equal(discordNameCalled, false);
  assert.equal(usersCalled, false);
});

test("admin account search returns empty users for short query", async () => {
  let linksCalled = false;
  let discordNameCalled = false;
  let usersCalled = false;
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => {
      linksCalled = true;
      return [];
    },
    findClerkUserIdsByDiscordName: async () => {
      discordNameCalled = true;
      return [];
    },
    findUsers: async () => {
      usersCalled = true;
      return [];
    },
  });
  const req = createMockRequest({ query: { q: "a" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { users: [] });
  assert.equal(linksCalled, false);
  assert.equal(discordNameCalled, false);
  assert.equal(usersCalled, false);
});

test("admin account search uses discord links and maps response shape", async () => {
  let captured: { query: string; identityClerkIds: string[] } | null = null;
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [{ clerkUserId: "clerk_1" }],
    findClerkUserIdsByDiscordName: async () => [],
    findUsers: async (args) => {
      captured = args;
      return [
        {
          id: 12,
          clerkUserId: "clerk_1",
          name: "playerOne",
          email: "p1@example.com",
          characters: [
            {
              character: {
                id: 44,
                characterName: "Valyn",
                className: "Armsman",
                realm: "Albion",
                totalRealmPoints: 123456,
              },
            },
          ],
          identityLinks: [{ provider: "discord", providerUserId: "99887766" }],
          _count: { groupUsers: 2, identityClaims: 1 },
        },
      ];
    },
  });
  const req = createMockRequest({ query: { q: "99887766" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    query: "99887766",
    identityClerkIds: ["clerk_1"],
  });
  assert.deepEqual(res.body, {
    users: [
      {
        id: 12,
        clerkUserId: "clerk_1",
        name: "playerOne",
        email: "p1@example.com",
        characters: [
          {
            id: 44,
            characterName: "Valyn",
            className: "Armsman",
            realm: "Albion",
            totalRealmPoints: 123456,
          },
        ],
        identityLinks: [{ provider: "discord", providerUserId: "99887766" }],
        groupCount: 2,
        claimCount: 1,
      },
    ],
  });
});

test("admin account search trims query before lookup", async () => {
  let captured: { query: string; identityClerkIds: string[] } | null = null;
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [],
    findClerkUserIdsByDiscordName: async () => [],
    findUsers: async (args) => {
      captured = args;
      return [];
    },
  });
  const req = createMockRequest({ query: { q: "  user@example.com  " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    query: "user@example.com",
    identityClerkIds: [],
  });
});

test("admin account search merges discord ID and discord-name matches", async () => {
  let captured: { query: string; identityClerkIds: string[] } | null = null;
  const handler = createAdminAccountSearchHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [{ clerkUserId: "clerk_id_match" }],
    findClerkUserIdsByDiscordName: async () => [
      "clerk_name_match",
      "clerk_id_match",
    ],
    findUsers: async (args) => {
      captured = args;
      return [];
    },
  });
  const req = createMockRequest({ query: { q: "discordname" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, {
    query: "discordname",
    identityClerkIds: ["clerk_id_match", "clerk_name_match"],
  });
});

test("admin account delete returns 405 for non-POST", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => null,
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => undefined,
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("admin account delete returns 401 when not authenticated", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    findLocalUser: async () => null,
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => undefined,
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_1" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("admin account delete returns 403 for non-admin", async () => {
  let findCalled = false;
  let localDeleteCalled = false;
  let clerkDeleteCalled = false;
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    findLocalUser: async () => {
      findCalled = true;
      return null;
    },
    deleteLocalUserData: async () => {
      localDeleteCalled = true;
    },
    deleteClerkUser: async () => {
      clerkDeleteCalled = true;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_1" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
  assert.equal(findCalled, false);
  assert.equal(localDeleteCalled, false);
  assert.equal(clerkDeleteCalled, false);
});

test("admin account delete validates clerkUserId", async () => {
  let findCalled = false;
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => {
      findCalled = true;
      return null;
    },
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => undefined,
  });
  const req = createMockRequest({
    method: "POST",
    body: {},
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "clerkUserId is required." });
  assert.equal(findCalled, false);
});

test("admin account delete still removes Clerk user when local user is missing", async () => {
  let localDeleteCalled = false;
  let clerkDeleteCalled = false;
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => null,
    deleteLocalUserData: async () => {
      localDeleteCalled = true;
    },
    deleteClerkUser: async () => {
      clerkDeleteCalled = true;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_missing" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    note: "Local user was already removed. Clerk account deleted successfully.",
  });
  assert.equal(localDeleteCalled, false);
  assert.equal(clerkDeleteCalled, true);
});

test("admin account delete returns 500 when local deletion fails", async () => {
  let clerkDeleteCalled = false;
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => ({ id: 2, name: "userTwo" }),
    deleteLocalUserData: async () => {
      throw new Error("tx failed");
    },
    deleteClerkUser: async () => {
      clerkDeleteCalled = true;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_2" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "tx failed" });
  assert.equal(clerkDeleteCalled, false);
});

test("admin account delete returns 200 success when local + clerk delete succeed", async () => {
  let localDeleted = false;
  let clerkDeleted = false;
  let lookedUpClerkId = "";
  let localDeleteArgs: { clerkUserId: string; userId: number } | null = null;
  let clerkDeleteId = "";
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async (clerkUserId) => {
      lookedUpClerkId = clerkUserId;
      return { id: 3, name: "userThree" };
    },
    deleteLocalUserData: async (args) => {
      localDeleteArgs = args;
      localDeleted = true;
    },
    deleteClerkUser: async (clerkUserId) => {
      clerkDeleteId = clerkUserId;
      clerkDeleted = true;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "  clerk_3  " },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(localDeleted, true);
  assert.equal(clerkDeleted, true);
  assert.equal(lookedUpClerkId, "clerk_3");
  assert.deepEqual(localDeleteArgs, { clerkUserId: "clerk_3", userId: 3 });
  assert.equal(clerkDeleteId, "clerk_3");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
});

test("admin account delete returns 200 success if clerk account already deleted", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => ({ id: 4, name: "userFour" }),
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => {
      const err: any = new Error("not found");
      err.status = 404;
      throw err;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_4" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
});

test("admin account delete returns 502 when clerk delete fails unexpectedly", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => ({ id: 5, name: "userFive" }),
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => {
      const err: any = new Error("network");
      err.status = 500;
      throw err;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_5" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, {
    error:
      "Local cleanup completed, but failed to remove the Clerk account. Please retry Clerk deletion.",
    localUserFound: true,
  });
});

test("admin account delete treats Clerk resource_not_found as success", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => ({ id: 6, name: "userSix" }),
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => {
      const err: any = new Error("not found");
      err.errors = [{ code: "resource_not_found" }];
      throw err;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_6" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
});

test("admin account delete returns success note when local user missing and Clerk already deleted", async () => {
  const handler = createAdminAccountDeleteHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => null,
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => {
      const err: any = new Error("not found");
      err.errors = [{ code: "resource_not_found" }];
      throw err;
    },
  });
  const req = createMockRequest({
    method: "POST",
    body: { clerkUserId: "clerk_7" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    note: "Local user was already removed and Clerk account was already deleted.",
  });
});
