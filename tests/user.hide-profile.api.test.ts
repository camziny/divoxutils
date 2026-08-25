import test from "node:test";
import assert from "node:assert/strict";
import { handleHideProfileApi, type HideProfileApiDeps } from "../src/server/hideProfileApi";

function createDeps(overrides?: Partial<HideProfileApiDeps>): HideProfileApiDeps {
  return {
    findUserHideProfile: async () => ({ hideProfile: false }),
    findUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    updateUserHideProfile: async (_clerkUserId, hideProfile) => ({ hideProfile }),
    revalidatePublicProfile: () => {},
    ...overrides,
  };
}

test("hide profile rejects unauthenticated requests", async () => {
  const result = await handleHideProfileApi(
    { method: "GET", clerkUserId: null },
    createDeps()
  );

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: "Unauthorized" });
});

test("hide profile GET returns current value", async () => {
  const result = await handleHideProfileApi(
    { method: "GET", clerkUserId: "user_1" },
    createDeps({ findUserHideProfile: async () => ({ hideProfile: true }) })
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { hideProfile: true });
});

test("hide profile GET returns 404 when user missing", async () => {
  const result = await handleHideProfileApi(
    { method: "GET", clerkUserId: "user_1" },
    createDeps({ findUserHideProfile: async () => null })
  );

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: "User not found" });
});

test("hide profile PUT rejects non-boolean value", async () => {
  const result = await handleHideProfileApi(
    { method: "PUT", clerkUserId: "user_1", body: { hideProfile: "yes" } },
    createDeps()
  );

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "Invalid hideProfile" });
});

test("hide profile PUT returns 404 when user missing", async () => {
  const result = await handleHideProfileApi(
    { method: "PUT", clerkUserId: "user_1", body: { hideProfile: true } },
    createDeps({ findUserByClerkId: async () => null })
  );

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: "User not found" });
});

test("hide profile PUT saves value and revalidates the public profile cache", async () => {
  let saved: boolean | null = null;
  let revalidated = false;
  const result = await handleHideProfileApi(
    { method: "PUT", clerkUserId: "user_1", body: { hideProfile: true } },
    createDeps({
      updateUserHideProfile: async (_clerkUserId, hideProfile) => {
        saved = hideProfile;
        return { hideProfile };
      },
      revalidatePublicProfile: () => {
        revalidated = true;
      },
    })
  );

  assert.equal(saved, true);
  assert.equal(revalidated, true);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { hideProfile: true });
});

test("hide profile rejects unsupported methods", async () => {
  const result = await handleHideProfileApi(
    { method: "DELETE", clerkUserId: "user_1" },
    createDeps()
  );

  assert.equal(result.status, 405);
  assert.equal(result.allow, "GET, PUT");
  assert.deepEqual(result.body, { error: "Method not allowed" });
});
