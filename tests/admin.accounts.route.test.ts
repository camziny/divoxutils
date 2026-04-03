import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminAccountDeleteRouteHandlers,
  createAdminAccountSearchRouteHandlers,
} from "../src/server/adminAccountsRouteHandlers";

test("admin account search route returns 405 for non-GET", async () => {
  const handlers = createAdminAccountSearchRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [],
    findClerkUserIdsByDiscordName: async () => [],
    findUsers: async () => [],
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/accounts/search?q=abc", { method: "POST" }) as any
  );
  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("admin account search route merges identity matches and maps shape", async () => {
  let captured: { query: string; identityClerkIds: string[] } | null = null;
  const handlers = createAdminAccountSearchRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findDiscordIdentityLinks: async () => [{ clerkUserId: "clerk_1" }],
    findClerkUserIdsByDiscordName: async () => ["clerk_2", "clerk_1"],
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
                id: 1,
                characterName: "Valyn",
                className: "Armsman",
                realm: "Albion",
                totalRealmPoints: 1000,
              },
            },
          ],
          identityLinks: [{ provider: "discord", providerUserId: "99887766" }],
          _count: { groupUsers: 2, identityClaims: 1 },
        },
      ];
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/admin/accounts/search?q=99887766") as any
  );
  assert.equal(response.status, 200);
  assert.deepEqual(captured, {
    query: "99887766",
    identityClerkIds: ["clerk_1", "clerk_2"],
  });
  assert.deepEqual(await response.json(), {
    users: [
      {
        id: 12,
        clerkUserId: "clerk_1",
        name: "playerOne",
        email: "p1@example.com",
        characters: [
          {
            id: 1,
            characterName: "Valyn",
            className: "Armsman",
            realm: "Albion",
            totalRealmPoints: 1000,
          },
        ],
        identityLinks: [{ provider: "discord", providerUserId: "99887766" }],
        groupCount: 2,
        claimCount: 1,
      },
    ],
  });
});

test("admin account delete route validates clerkUserId", async () => {
  let findCalled = false;
  const handlers = createAdminAccountDeleteRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => {
      findCalled = true;
      return null;
    },
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => undefined,
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/accounts/delete", {
      method: "POST",
      body: JSON.stringify({}),
    }) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "clerkUserId is required." });
  assert.equal(findCalled, false);
});

test("admin account delete route returns 502 when clerk delete fails unexpectedly", async () => {
  const handlers = createAdminAccountDeleteRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findLocalUser: async () => ({ id: 1, name: "x" }),
    deleteLocalUserData: async () => undefined,
    deleteClerkUser: async () => {
      const err: any = new Error("network");
      err.status = 500;
      throw err;
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/accounts/delete", {
      method: "POST",
      body: JSON.stringify({ clerkUserId: "clerk_1" }),
    }) as any
  );
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error:
      "Local cleanup completed, but failed to remove the Clerk account. Please retry Clerk deletion.",
    localUserFound: true,
  });
});

test("admin account delete route rejects invalid JSON body", async () => {
  let findCalled = false;
  let localDeleteCalled = false;
  let clerkDeleteCalled = false;
  const handlers = createAdminAccountDeleteRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
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

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/accounts/delete", {
      method: "POST",
      body: "{",
      headers: {
        "content-type": "application/json",
      },
    }) as any
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body." });
  assert.equal(findCalled, false);
  assert.equal(localDeleteCalled, false);
  assert.equal(clerkDeleteCalled, false);
});
