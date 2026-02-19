import test from "node:test";
import assert from "node:assert/strict";
import { createOverallDraftStatsHandler } from "../pages/api/draft-stats/overall";
import { createCaptainDraftStatsHandler } from "../pages/api/draft-stats/captain";
import { createHeadToHeadDraftStatsHandler } from "../pages/api/draft-stats/head-to-head";
import { createPlayerDraftDrilldownHandler } from "../pages/api/draft-stats/player-drilldown";
import { createDraftLogHandler } from "../pages/api/draft-stats/drafts";

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
}) {
  return {
    method: options?.method ?? "GET",
    body: {},
    query: options?.query ?? {},
    headers: {},
  } as any;
}

test("overall draft stats rejects unsupported method", async () => {
  const handler = createOverallDraftStatsHandler({
    getOverallRows: async () => [],
  });
  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers.Allow, ["GET"]);
});

test("overall draft stats validates numeric query params", async () => {
  const handler = createOverallDraftStatsHandler({
    getOverallRows: async () => [],
  });
  const req = createMockRequest({ query: { minGames: "abc" } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "minGames must be a non-negative integer." });
});

test("overall draft stats returns 500 for runtime failures", async () => {
  const handler = createOverallDraftStatsHandler({
    getOverallRows: async () => {
      throw new Error("boom");
    },
  });
  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Failed to load draft stats." });
});

test("captain draft stats validates date range", async () => {
  const handler = createCaptainDraftStatsHandler({
    getCaptainRows: async () => [],
  });
  const req = createMockRequest({
    query: { startTimeMs: "200", endTimeMs: "100" },
  });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "startTimeMs must be less than or equal to endTimeMs.",
  });
});

test("captain draft stats returns rows on success", async () => {
  const handler = createCaptainDraftStatsHandler({
    getCaptainRows: async () => [{ clerkUserId: "u1", wins: 2 }],
  });
  const req = createMockRequest({ query: { guildId: "g1", minGames: "2" } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    rows: [{ clerkUserId: "u1", wins: 2 }],
    filters: { guildId: "g1", startTimeMs: undefined, endTimeMs: undefined, minGames: 2 },
  });
});

test("head-to-head draft stats validates required ids", async () => {
  const handler = createHeadToHeadDraftStatsHandler({
    getHeadToHeadRow: async () => null,
  });
  const req = createMockRequest({ query: { playerClerkUserId: "u1" } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "playerClerkUserId and opponentClerkUserId are required.",
  });
});

test("head-to-head draft stats validates same-player query", async () => {
  const handler = createHeadToHeadDraftStatsHandler({
    getHeadToHeadRow: async () => null,
  });
  const req = createMockRequest({
    query: { playerClerkUserId: "u1", opponentClerkUserId: "u1" },
  });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "playerClerkUserId and opponentClerkUserId must differ.",
  });
});

test("head-to-head draft stats returns 500 for runtime failures", async () => {
  const handler = createHeadToHeadDraftStatsHandler({
    getHeadToHeadRow: async () => {
      throw new Error("boom");
    },
  });
  const req = createMockRequest({
    query: { playerClerkUserId: "u1", opponentClerkUserId: "u2" },
  });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Failed to load head-to-head stats." });
});

test("player drilldown validates required player id", async () => {
  const handler = createPlayerDraftDrilldownHandler({
    getPlayerDrilldown: async () => null,
  });
  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "playerClerkUserId is required." });
});

test("player drilldown validates filter query params", async () => {
  const handler = createPlayerDraftDrilldownHandler({
    getPlayerDrilldown: async () => null,
  });
  const req = createMockRequest({
    query: { playerClerkUserId: "u1", minGames: "-1" },
  });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "minGames must be a non-negative integer." });
});

test("player drilldown returns 500 for runtime failures", async () => {
  const handler = createPlayerDraftDrilldownHandler({
    getPlayerDrilldown: async () => {
      throw new Error("boom");
    },
  });
  const req = createMockRequest({ query: { playerClerkUserId: "u1" } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Failed to load player drilldown." });
});

test("draft log endpoint rejects unsupported method", async () => {
  const handler = createDraftLogHandler({
    getRows: async () => [],
  });
  const req = createMockRequest({ method: "PUT" });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers.Allow, ["GET"]);
});

test("draft log endpoint returns rows on success", async () => {
  const handler = createDraftLogHandler({
    getRows: async () => [{ shortId: "a1" }],
  });
  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { rows: [{ shortId: "a1" }] });
});

test("draft log endpoint returns 500 on runtime failure", async () => {
  const handler = createDraftLogHandler({
    getRows: async () => {
      throw new Error("boom");
    },
  });
  const req = createMockRequest();
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Failed to load draft log." });
});
