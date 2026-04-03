import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminSupportersListRouteHandlers,
  createAdminSupportersSearchRouteHandlers,
  createAdminSupportersUpdateRouteHandlers,
} from "../src/server/adminSupportersRouteHandlers";

test("supporters route list rejects non-GET", async () => {
  const handlers = createAdminSupportersListRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findSupporters: async () => [],
  });

  const response = await handlers.POST();
  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("supporters route list returns supporters", async () => {
  const handlers = createAdminSupportersListRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    findSupporters: async () => [
      {
        id: 1,
        clerkUserId: "clerk_1",
        name: "Player",
        supporterTier: 2,
        supporterAmount: 60,
      },
    ],
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    supporters: [
      {
        id: 1,
        clerkUserId: "clerk_1",
        name: "Player",
        supporterTier: 2,
        supporterAmount: 60,
      },
    ],
  });
});

test("supporters route search trims query and returns users", async () => {
  let capturedQuery = "";
  const handlers = createAdminSupportersSearchRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    searchUsers: async (query) => {
      capturedQuery = query;
      return [];
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/admin/supporters/search?q=%20%20abc%20%20") as any
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { users: [] });
  assert.equal(capturedQuery, "abc");
});

test("supporters route update validates payload and computes tier", async () => {
  let captured: { clerkUserId: string; addAmount: number } | null = null;
  const handlers = createAdminSupportersUpdateRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    applySupporterContribution: async (args) => {
      captured = args;
      return { supporterAmount: 105, supporterTier: 3 };
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/supporters/update", {
      method: "POST",
      body: JSON.stringify({ clerkUserId: "clerk_1", addAmount: 10 }),
    }) as any
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    clerkUserId: "clerk_1",
    supporterAmount: 105,
    supporterTier: 3,
  });
  assert.deepEqual(captured, {
    clerkUserId: "clerk_1",
    addAmount: 10,
  });
});

test("supporters route update rejects invalid JSON body", async () => {
  let applyCalled = false;
  const handlers = createAdminSupportersUpdateRouteHandlers({
    getAuthUserId: async () => "admin_1",
    isAdminUserId: () => true,
    applySupporterContribution: async () => {
      applyCalled = true;
      return { supporterAmount: 1, supporterTier: 0 };
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/admin/supporters/update", {
      method: "POST",
      body: "{",
      headers: {
        "content-type": "application/json",
      },
    }) as any
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body." });
  assert.equal(applyCalled, false);
});
