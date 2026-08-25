import test from "node:test";
import assert from "node:assert/strict";
import { isForbiddenViewer, resolveViewer } from "../src/server/viewerAuthorization";

test("isForbiddenViewer forbids a different, non-admin viewer", () => {
  assert.equal(isForbiddenViewer("user_2", "user_1", false), true);
});

test("isForbiddenViewer allows the owner", () => {
  assert.equal(isForbiddenViewer("user_1", "user_1", false), false);
});

test("isForbiddenViewer allows an admin viewing anyone", () => {
  assert.equal(isForbiddenViewer("admin_1", "user_1", true), false);
});

test("isForbiddenViewer forbids an anonymous viewer", () => {
  assert.equal(isForbiddenViewer(null, "user_1", false), true);
});

test("resolveViewer combines the auth lookup and admin check", async () => {
  const result = await resolveViewer(
    async () => "user_1",
    (clerkUserId) => clerkUserId === "user_1"
  );
  assert.deepEqual(result, { viewerClerkUserId: "user_1", viewerIsAdmin: true });
});

test("resolveViewer handles an anonymous viewer", async () => {
  const result = await resolveViewer(
    async () => null,
    () => false
  );
  assert.deepEqual(result, { viewerClerkUserId: null, viewerIsAdmin: false });
});
