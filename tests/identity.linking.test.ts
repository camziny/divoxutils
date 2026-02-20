import test from "node:test";
import assert from "node:assert/strict";
import { createLinkDiscordIdentityHandler } from "../pages/api/identity/link-discord";
import { createClaimDiscordIdentityHandler } from "../pages/api/identity/claim-discord";
import { createModerateClaimHandler } from "../pages/api/identity/moderate-claim";
import { createPendingClaimsHandler } from "../pages/api/identity/pending-claims";
import { createAdminDraftsHandler } from "../pages/api/admin/drafts";
import { createModerateDraftHandler } from "../pages/api/admin/drafts/moderate";

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

test("link-discord rejects unauthenticated requests", async () => {
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => null,
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("link-discord rejects non-POST requests", async () => {
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("link-discord uses body discordUserId and upserts identity link", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async (data) => {
      upsertCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({
    body: { discordUserId: "123456789" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(upsertCalls.length, 1);
  assert.deepEqual(upsertCalls[0], {
    clerkUserId: "user_1",
    provider: "discord",
    providerUserId: "123456789",
    status: "linked",
  });
});

test("link-discord rejects if discord account belongs to another user", async () => {
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => ({ clerkUserId: "user_2" }),
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({
    body: { discordUserId: "123456789" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    error: "Discord user is already linked to another account.",
  });
});

test("link-discord falls back to Clerk discord id resolution", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => "99887766",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async (data) => {
      upsertCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({
    body: {},
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(upsertCalls[0].providerUserId, "99887766");
});

test("link-discord returns 400 when signed-in user has no Discord identity to resolve", async () => {
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({ body: {} });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "Unable to determine Discord user id for this account.",
  });
});

test("link-discord returns 404 when local user does not exist", async () => {
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => "123",
    findLocalUserByClerkId: async () => null,
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
  });

  const req = createMockRequest({ body: {} });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found." });
});

test("link-discord allows relinking when discord identity is already linked to same user", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const handler = createLinkDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    resolveDiscordUserIdFromClerk: async () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => ({ clerkUserId: "user_1" }),
    upsertIdentityLink: async (data) => {
      upsertCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({
    body: { discordUserId: "123456789" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(upsertCalls.length, 1);
});

test("claim-discord creates pending claim", async () => {
  const createdClaims: Array<Record<string, string | undefined>> = [];
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => null,
    createClaim: async (data) => {
      createdClaims.push(data);
      return { id: 5, status: "pending" };
    },
  });

  const req = createMockRequest({
    body: { discordUserId: "777", draftId: "draft_1" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdClaims.length, 1);
  assert.deepEqual(createdClaims[0], {
    clerkUserId: "user_1",
    provider: "discord",
    providerUserId: "777",
    draftId: "draft_1",
    status: "pending",
  });
});

test("claim-discord rejects non-POST requests", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => null,
    createClaim: async () => ({ id: 10, status: "pending" }),
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("claim-discord rejects unauthenticated requests", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => null,
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => null,
    createClaim: async () => ({ id: 10, status: "pending" }),
  });

  const req = createMockRequest({
    body: { discordUserId: "777" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("claim-discord rejects missing discord user id", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => null,
    createClaim: async () => ({ id: 10, status: "pending" }),
  });

  const req = createMockRequest({
    body: { discordUserId: "   " },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "discordUserId is required." });
});

test("claim-discord returns 404 when local user does not exist", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => null,
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => null,
    createClaim: async () => ({ id: 10, status: "pending" }),
  });

  const req = createMockRequest({
    body: { discordUserId: "777" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "User not found." });
});

test("claim-discord rejects duplicate pending claims", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => null,
    findPendingClaim: async () => ({ id: 1 }),
    createClaim: async () => ({ id: 10, status: "pending" }),
  });

  const req = createMockRequest({
    body: { discordUserId: "777" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { error: "A pending claim already exists." });
});

test("claim-discord rejects if discord account already linked to another user", async () => {
  const handler = createClaimDiscordIdentityHandler({
    getAuthUserId: () => "user_1",
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_1" }),
    findIdentityLinkByProviderUserId: async () => ({ clerkUserId: "user_2" }),
    findPendingClaim: async () => null,
    createClaim: async () => ({ id: 11, status: "pending" }),
  });

  const req = createMockRequest({
    body: { discordUserId: "777" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    error: "Discord user is already linked to another account.",
  });
});

test("moderate-claim rejects unauthorized requests", async () => {
  const handler = createModerateClaimHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    findClaimById: async () => null,
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
    updateClaimReview: async () => ({}),
  });

  const req = createMockRequest({
    body: { claimId: 1, action: "approve" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("moderate-claim rejects authenticated non-admin user", async () => {
  const handler = createModerateClaimHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    findClaimById: async () => null,
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
    updateClaimReview: async () => ({}),
  });

  const req = createMockRequest({
    body: { claimId: 1, action: "approve" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("moderate-claim approves pending claim and links identity", async () => {
  const upsertCalls: Array<Record<string, string>> = [];
  const reviewCalls: Array<Record<string, unknown>> = [];
  const handler = createModerateClaimHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findClaimById: async () => ({
      id: 10,
      clerkUserId: "user_1",
      provider: "discord",
      providerUserId: "999",
      status: "pending",
    }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async (data) => {
      upsertCalls.push(data);
      return {};
    },
    updateClaimReview: async (data) => {
      reviewCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({
    body: { claimId: 10, action: "approve" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(upsertCalls[0], {
    clerkUserId: "user_1",
    provider: "discord",
    providerUserId: "999",
    status: "linked",
  });
  assert.deepEqual(reviewCalls[0], {
    claimId: 10,
    status: "approved",
    reviewedByClerkUserId: "admin_1",
  });
});

test("moderate-claim rejects pending approval if identity is linked elsewhere", async () => {
  const handler = createModerateClaimHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findClaimById: async () => ({
      id: 10,
      clerkUserId: "user_1",
      provider: "discord",
      providerUserId: "999",
      status: "pending",
    }),
    findIdentityLinkByProviderUserId: async () => ({ clerkUserId: "other_user" }),
    upsertIdentityLink: async () => ({}),
    updateClaimReview: async () => ({}),
  });

  const req = createMockRequest({
    body: { claimId: 10, action: "approve" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    error: "Cannot approve claim because identity is linked to another account.",
  });
});

test("moderate-claim rejects pending claim", async () => {
  const reviewCalls: Array<Record<string, unknown>> = [];
  const handler = createModerateClaimHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findClaimById: async () => ({
      id: 11,
      clerkUserId: "user_1",
      provider: "discord",
      providerUserId: "888",
      status: "pending",
    }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
    updateClaimReview: async (data) => {
      reviewCalls.push(data);
      return {};
    },
  });

  const req = createMockRequest({
    body: { claimId: 11, action: "reject" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(reviewCalls[0], {
    claimId: 11,
    status: "rejected",
    reviewedByClerkUserId: "admin_1",
  });
});

test("moderate-claim rejects non-pending claim", async () => {
  const handler = createModerateClaimHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    findClaimById: async () => ({
      id: 12,
      clerkUserId: "user_1",
      provider: "discord",
      providerUserId: "777",
      status: "approved",
    }),
    findIdentityLinkByProviderUserId: async () => null,
    upsertIdentityLink: async () => ({}),
    updateClaimReview: async () => ({}),
  });

  const req = createMockRequest({
    body: { claimId: 12, action: "reject" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { error: "Claim is not pending." });
});

test("pending-claims rejects unauthenticated requests", async () => {
  const handler = createPendingClaimsHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    listPendingClaims: async () => [],
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("pending-claims rejects non-admin requests", async () => {
  const handler = createPendingClaimsHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    listPendingClaims: async () => [],
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("pending-claims returns pending claims for admins", async () => {
  const claims = [
    {
      id: 5,
      clerkUserId: "user_1",
      provider: "discord",
      providerUserId: "123",
      draftId: "draft_1",
      status: "pending",
      createdAt: new Date("2026-02-19T13:00:00.000Z"),
    },
  ];
  const handler = createPendingClaimsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listPendingClaims: async () => claims,
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { claims });
});

test("admin drafts rejects unauthenticated requests", async () => {
  const handler = createAdminDraftsHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    listPendingDrafts: async () => [],
    listReviewedDrafts: async () => [],
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("admin drafts rejects non-admin requests", async () => {
  const handler = createAdminDraftsHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    listPendingDrafts: async () => [],
    listReviewedDrafts: async () => [],
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("admin drafts returns pending and reviewed draft lists for admins", async () => {
  const pendingDrafts = [{ shortId: "abc123", resultStatus: "unverified" }];
  const reviewedDrafts = [{ shortId: "xyz789", resultStatus: "voided" }];
  const handler = createAdminDraftsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    listPendingDrafts: async () => pendingDrafts,
    listReviewedDrafts: async () => reviewedDrafts,
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { pendingDrafts, reviewedDrafts });
});

test("moderate draft rejects non-admin requests", async () => {
  const handler = createModerateDraftHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    moderateDraftResult: async () => ({}),
  });

  const req = createMockRequest({
    body: { shortId: "abc123", action: "verify" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("moderate draft validates action", async () => {
  const handler = createModerateDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    moderateDraftResult: async () => ({}),
  });

  const req = createMockRequest({
    body: { shortId: "abc123", action: "invalid" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "action must be verify or void." });
});

test("moderate draft supports reversible actions and trims note", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const handler = createModerateDraftHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    moderateDraftResult: async (args) => {
      calls.push(args);
      return { shortId: args.shortId, resultStatus: "voided" };
    },
  });

  const req = createMockRequest({
    body: { shortId: "abc123", action: "void", note: "  re-check evidence  " },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls[0], {
    shortId: "abc123",
    action: "void",
    moderatedByClerkUserId: "admin_1",
    note: "re-check evidence",
  });
});
