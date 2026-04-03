import test from "node:test";
import assert from "node:assert/strict";
import { createAdminDraftFightsHandler } from "../src/server/adminDraftsRouteHandlers";

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

test("draft fights API rejects non-POST requests", async () => {
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    replaceDraftFights: async () => ({}),
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("draft fights API rejects unauthorized requests", async () => {
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => null,
    isAdminUserId: () => true,
    replaceDraftFights: async () => ({}),
  });
  const req = createMockRequest();
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("draft fights API rejects non-admin requests", async () => {
  let mutationCalled = false;
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "user_1",
    isAdminUserId: () => false,
    replaceDraftFights: async () => {
      mutationCalled = true;
      return {};
    },
  });
  const req = createMockRequest();
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
  assert.equal(mutationCalled, false);
});

test("draft fights API validates required shortId and fights", async () => {
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    replaceDraftFights: async () => ({}),
  });

  const missingShortReq = createMockRequest({
    body: { shortId: " ", fights: [{ winnerTeam: 1, classesByPlayer: [] }] },
  });
  const missingShortRes = createMockResponse();
  await handler(missingShortReq, missingShortRes);
  assert.equal(missingShortRes.statusCode, 400);
  assert.deepEqual(missingShortRes.body, { error: "shortId is required." });

  const missingFightsReq = createMockRequest({
    body: { shortId: "abc123", fights: [] },
  });
  const missingFightsRes = createMockResponse();
  await handler(missingFightsReq, missingFightsRes);
  assert.equal(missingFightsRes.statusCode, 400);
  assert.deepEqual(missingFightsRes.body, { error: "At least one fight is required." });
});

test("draft fights API validates substitute payload consistency", async () => {
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    replaceDraftFights: async () => ({}),
  });

  const missingModeReq = createMockRequest({
    body: {
      shortId: "abc123",
      fights: [
        {
          winnerTeam: 1,
          classesByPlayer: [
            {
              playerId: "p1",
              className: "Armsman",
              substituteDisplayName: "Sub",
            },
          ],
        },
      ],
    },
  });
  const missingModeRes = createMockResponse();
  await handler(missingModeReq, missingModeRes);
  assert.equal(missingModeRes.statusCode, 400);
  assert.deepEqual(missingModeRes.body, {
    error: "substituteMode is required when substitute fields are provided.",
  });

  const manualDiscordReq = createMockRequest({
    body: {
      shortId: "abc123",
      fights: [
        {
          winnerTeam: 1,
          classesByPlayer: [
            {
              playerId: "p1",
              className: "Armsman",
              substituteMode: "manual",
              substituteDiscordUserId: "d5",
              substituteDisplayName: "Sub",
            },
          ],
        },
      ],
    },
  });
  const manualDiscordRes = createMockResponse();
  await handler(manualDiscordReq, manualDiscordRes);
  assert.equal(manualDiscordRes.statusCode, 400);
  assert.deepEqual(manualDiscordRes.body, {
    error: "Manual substitute entries cannot include substituteDiscordUserId.",
  });
});

test("draft fights API passes payload to mutation and returns success", async () => {
  let captured: any = null;
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "admin_clerk_1",
    isAdminUserId: () => true,
    replaceDraftFights: async (args) => {
      captured = args;
      return {};
    },
  });
  const req = createMockRequest({
    body: {
      shortId: "  d1234  ",
      fights: [
        {
          winnerTeam: 1,
          classesByPlayer: [
            {
              playerId: "p1",
              className: "Armsman",
              substituteMode: "known",
              substituteDiscordUserId: "d5",
              substituteDisplayName: "SubFive",
              substituteAvatarUrl: "https://cdn.example.com/subfive.png",
            },
            { playerId: "p2", className: "Bard" },
          ],
        },
      ],
    },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.deepEqual(captured, {
    shortId: "d1234",
    submittedBy: "admin_clerk_1",
    fights: [
      {
        winnerTeam: 1,
        classesByPlayer: [
          {
            playerId: "p1",
            className: "Armsman",
            substituteMode: "known",
            substituteDiscordUserId: "d5",
            substituteDisplayName: "SubFive",
            substituteAvatarUrl: "https://cdn.example.com/subfive.png",
          },
          { playerId: "p2", className: "Bard" },
        ],
      },
    ],
  });
});

test("draft fights API surfaces server errors", async () => {
  const handler = createAdminDraftFightsHandler({
    getAuthUserId: () => "admin_1",
    isAdminUserId: () => true,
    replaceDraftFights: async () => {
      throw new Error("convex failed");
    },
  });
  const req = createMockRequest({
    body: {
      shortId: "abc123",
      fights: [{ winnerTeam: 2, classesByPlayer: [{ playerId: "p1", className: "Cleric" }] }],
    },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "convex failed" });
});
