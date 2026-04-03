import test from "node:test";
import assert from "node:assert/strict";
import { createLayoutPreferenceRouteHandlers } from "../src/server/layoutPreferenceRouteHandlers";

function createHandlers(options?: {
  userId?: string | null;
  findUserLayout?: () => Promise<{ preferredCharacterListLayout: string } | null>;
  findUserByClerkId?: () => Promise<{ clerkUserId: string } | null>;
  updateUserLayout?: (
    clerkUserId: string,
    layout: "table" | "realm-grid"
  ) => Promise<{ preferredCharacterListLayout: string }>;
}) {
  const userId =
    options && Object.prototype.hasOwnProperty.call(options, "userId")
      ? options.userId ?? null
      : "user_1";

  return createLayoutPreferenceRouteHandlers({
    getAuthUserId: async () => userId,
    apiDeps: {
      findUserLayout:
        options?.findUserLayout ??
        (async () => ({ preferredCharacterListLayout: "table" })),
      findUserByClerkId:
        options?.findUserByClerkId ?? (async () => ({ clerkUserId: "user_1" })),
      updateUserLayout:
        options?.updateUserLayout ??
        (async (_clerkUserId, layout) => ({
          preferredCharacterListLayout: layout,
        })),
    },
  });
}

test("route GET rejects unauthenticated requests", async () => {
  const handlers = createHandlers({ userId: null });
  const request = new Request("http://localhost/api/user/preferences/layout");

  const response = await handlers.GET(request as any);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("route GET returns table fallback for unknown db value", async () => {
  const handlers = createHandlers({
    findUserLayout: async () => ({ preferredCharacterListLayout: "legacy-view" }),
  });
  const request = new Request("http://localhost/api/user/preferences/layout");

  const response = await handlers.GET(request as any);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { layout: "table" });
});

test("route PUT validates layout value", async () => {
  const handlers = createHandlers();
  const request = new Request("http://localhost/api/user/preferences/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout: "invalid" }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid layout" });
});

test("route PUT returns 404 when user missing", async () => {
  const handlers = createHandlers({
    findUserByClerkId: async () => null,
  });
  const request = new Request("http://localhost/api/user/preferences/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout: "realm-grid" }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "User not found" });
});

test("route PUT saves and returns layout", async () => {
  let savedLayout: string | null = null;
  const handlers = createHandlers({
    updateUserLayout: async (_userId, layout) => {
      savedLayout = layout;
      return { preferredCharacterListLayout: layout };
    },
  });
  const request = new Request("http://localhost/api/user/preferences/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout: "realm-grid" }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(savedLayout, "realm-grid");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { layout: "realm-grid" });
});

test("route POST returns 405 with Allow header", async () => {
  const handlers = createHandlers();
  const request = new Request("http://localhost/api/user/preferences/layout", {
    method: "POST",
  });

  const response = await handlers.POST(request as any);

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, PUT");
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});
