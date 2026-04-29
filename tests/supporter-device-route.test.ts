import test from "node:test";
import assert from "node:assert/strict";
import { createSupporterDeviceHandler } from "../src/server/api/supporterDeviceRouteHandler";

const activeSupporter = {
  supporterTier: 0,
  subscriptionStatus: "active",
  subscriptionCancelAtPeriodEnd: false,
  subscriptionCurrentPeriodEnd: null,
};

test("supporter device route requires POST and auth", async () => {
  const handler = createSupporterDeviceHandler({
    getAuthUserId: async () => null,
    isAdminClerkUserId: () => false,
    findUserByClerkId: async () => null,
    createCookieValue: () => "cookie-value",
  });

  const methodResult = await handler({ method: "GET" });
  assert.equal(methodResult.status, 405);
  assert.equal(methodResult.cookieAction, "none");

  const authResult = await handler({ method: "POST" });
  assert.equal(authResult.status, 401);
  assert.equal(authResult.cookieAction, "none");
});

test("supporter device route sets cookie for active supporters and admins", async () => {
  const supporterHandler = createSupporterDeviceHandler({
    getAuthUserId: async () => "user_supporter",
    isAdminClerkUserId: () => false,
    findUserByClerkId: async () => activeSupporter,
    createCookieValue: () => "supporter-cookie",
  });
  const supporterResult = await supporterHandler({ method: "POST" });
  assert.equal(supporterResult.status, 200);
  assert.equal(supporterResult.body.hasSupporterDeviceGrace, true);
  assert.equal(supporterResult.cookieAction, "set");
  assert.equal(supporterResult.cookieValue, "supporter-cookie");

  let lookupCalls = 0;
  const adminHandler = createSupporterDeviceHandler({
    getAuthUserId: async () => "user_admin",
    isAdminClerkUserId: () => true,
    findUserByClerkId: async () => {
      lookupCalls += 1;
      return null;
    },
    createCookieValue: () => "admin-cookie",
  });
  const adminResult = await adminHandler({ method: "POST" });
  assert.equal(adminResult.status, 200);
  assert.equal(adminResult.body.hasSupporterDeviceGrace, true);
  assert.equal(adminResult.cookieAction, "set");
  assert.equal(adminResult.cookieValue, "admin-cookie");
  assert.equal(lookupCalls, 0);
});

test("supporter device route clears cookie for signed-in non-supporters", async () => {
  const handler = createSupporterDeviceHandler({
    getAuthUserId: async () => "user_free",
    isAdminClerkUserId: () => false,
    findUserByClerkId: async () => ({
      supporterTier: 0,
      subscriptionStatus: "canceled",
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    }),
    createCookieValue: () => "cookie-value",
  });

  const result = await handler({ method: "POST" });
  assert.equal(result.status, 200);
  assert.equal(result.body.hasSupporterDeviceGrace, false);
  assert.equal(result.cookieAction, "clear");
});

test("supporter device route reports misconfiguration when cookie cannot be signed", async () => {
  const handler = createSupporterDeviceHandler({
    getAuthUserId: async () => "user_supporter",
    isAdminClerkUserId: () => false,
    findUserByClerkId: async () => activeSupporter,
    createCookieValue: () => null,
  });

  const result = await handler({ method: "POST" });
  assert.equal(result.status, 500);
  assert.equal(result.cookieAction, "none");
  assert.equal(result.body.hasSupporterDeviceGrace, false);
});
