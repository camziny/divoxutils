import test from "node:test";
import assert from "node:assert/strict";
import { createHideProfileRouteHandlers } from "../src/server/hideProfileRouteHandlers";

function createHandlers(options?: {
  userId?: string | null;
  findUserHideProfile?: () => Promise<{ hideProfile: boolean } | null>;
  findUserByClerkId?: () => Promise<{ clerkUserId: string } | null>;
  updateUserHideProfile?: (
    clerkUserId: string,
    hideProfile: boolean
  ) => Promise<{ hideProfile: boolean }>;
  revalidatePublicProfile?: () => void;
}) {
  const userId =
    options && Object.prototype.hasOwnProperty.call(options, "userId")
      ? options.userId ?? null
      : "user_1";

  return createHideProfileRouteHandlers({
    getAuthUserId: async () => userId,
    apiDeps: {
      findUserHideProfile:
        options?.findUserHideProfile ?? (async () => ({ hideProfile: false })),
      findUserByClerkId:
        options?.findUserByClerkId ?? (async () => ({ clerkUserId: "user_1" })),
      updateUserHideProfile:
        options?.updateUserHideProfile ??
        (async (_clerkUserId, hideProfile) => ({ hideProfile })),
      revalidatePublicProfile: options?.revalidatePublicProfile ?? (() => {}),
    },
  });
}

test("route GET rejects unauthenticated requests", async () => {
  const handlers = createHandlers({ userId: null });
  const request = new Request("http://localhost/api/user/preferences/hide-profile");

  const response = await handlers.GET(request as any);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("route GET returns current value", async () => {
  const handlers = createHandlers({
    findUserHideProfile: async () => ({ hideProfile: true }),
  });
  const request = new Request("http://localhost/api/user/preferences/hide-profile");

  const response = await handlers.GET(request as any);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { hideProfile: true });
});

test("route PUT validates hideProfile value", async () => {
  const handlers = createHandlers();
  const request = new Request("http://localhost/api/user/preferences/hide-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hideProfile: "invalid" }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid hideProfile" });
});

test("route PUT returns 404 when user missing", async () => {
  const handlers = createHandlers({
    findUserByClerkId: async () => null,
  });
  const request = new Request("http://localhost/api/user/preferences/hide-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hideProfile: true }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "User not found" });
});

test("route PUT saves and revalidates on success", async () => {
  let saved: boolean | null = null;
  let revalidated = false;
  const handlers = createHandlers({
    updateUserHideProfile: async (_clerkUserId, hideProfile) => {
      saved = hideProfile;
      return { hideProfile };
    },
    revalidatePublicProfile: () => {
      revalidated = true;
    },
  });
  const request = new Request("http://localhost/api/user/preferences/hide-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hideProfile: true }),
  });

  const response = await handlers.PUT(request as any);

  assert.equal(saved, true);
  assert.equal(revalidated, true);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { hideProfile: true });
});
