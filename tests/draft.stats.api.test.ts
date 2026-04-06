import test from "node:test";
import assert from "node:assert/strict";
import {
  createCaptainDraftStatsRouteHandlers,
  createDraftLogRouteHandlers,
  createHeadToHeadDraftStatsRouteHandlers,
  createOverallDraftStatsRouteHandlers,
  createPlayerDraftDrilldownRouteHandlers,
} from "../src/server/api/draftStatsApiRouteHandlers";

test("overall draft stats rejects unsupported method", async () => {
  const handlers = createOverallDraftStatsRouteHandlers({
    getOverallRows: async () => [],
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/overall", {
      method: "POST",
    }) as any
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("overall draft stats validates numeric query params", async () => {
  const handlers = createOverallDraftStatsRouteHandlers({
    getOverallRows: async () => [],
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/overall?minGames=abc"
    ) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "minGames must be a non-negative integer.",
  });
});

test("overall draft stats returns 500 for runtime failures", async () => {
  const handlers = createOverallDraftStatsRouteHandlers({
    getOverallRows: async () => {
      throw new Error("boom");
    },
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/overall") as any
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Failed to load draft stats." });
});

test("captain draft stats validates date range", async () => {
  const handlers = createCaptainDraftStatsRouteHandlers({
    getCaptainRows: async () => [],
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/captain?startTimeMs=200&endTimeMs=100"
    ) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "startTimeMs must be less than or equal to endTimeMs.",
  });
});

test("captain draft stats returns rows on success", async () => {
  const handlers = createCaptainDraftStatsRouteHandlers({
    getCaptainRows: async () => [{ clerkUserId: "u1", wins: 2 }],
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/captain?guildId=g1&minGames=2"
    ) as any
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    rows: [{ clerkUserId: "u1", wins: 2 }],
    filters: {
      guildId: "g1",
      minGames: 2,
    },
  });
});

test("head-to-head draft stats validates required ids", async () => {
  const handlers = createHeadToHeadDraftStatsRouteHandlers({
    getHeadToHeadRow: async () => null,
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/head-to-head?playerClerkUserId=u1"
    ) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "playerClerkUserId and opponentClerkUserId are required.",
  });
});

test("head-to-head draft stats validates same-player query", async () => {
  const handlers = createHeadToHeadDraftStatsRouteHandlers({
    getHeadToHeadRow: async () => null,
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/head-to-head?playerClerkUserId=u1&opponentClerkUserId=u1"
    ) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "playerClerkUserId and opponentClerkUserId must differ.",
  });
});

test("head-to-head draft stats returns 500 for runtime failures", async () => {
  const handlers = createHeadToHeadDraftStatsRouteHandlers({
    getHeadToHeadRow: async () => {
      throw new Error("boom");
    },
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/head-to-head?playerClerkUserId=u1&opponentClerkUserId=u2"
    ) as any
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to load head-to-head stats.",
  });
});

test("player drilldown validates required player id", async () => {
  const handlers = createPlayerDraftDrilldownRouteHandlers({
    getPlayerDrilldown: async () => null,
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/player-drilldown") as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "playerClerkUserId is required.",
  });
});

test("player drilldown validates filter query params", async () => {
  const handlers = createPlayerDraftDrilldownRouteHandlers({
    getPlayerDrilldown: async () => null,
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/player-drilldown?playerClerkUserId=u1&minGames=-1"
    ) as any
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "minGames must be a non-negative integer.",
  });
});

test("player drilldown returns 500 for runtime failures", async () => {
  const handlers = createPlayerDraftDrilldownRouteHandlers({
    getPlayerDrilldown: async () => {
      throw new Error("boom");
    },
  });
  const response = await handlers.GET(
    new Request(
      "http://localhost/api/draft-stats/player-drilldown?playerClerkUserId=u1"
    ) as any
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to load player drilldown.",
  });
});

test("draft log endpoint rejects unsupported method", async () => {
  const handlers = createDraftLogRouteHandlers({
    getRows: async () => [],
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/drafts", {
      method: "PUT",
    }) as any
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("draft log endpoint returns rows on success", async () => {
  const rows = [
    {
      shortId: "a1",
      type: "traditional",
      discordGuildId: "123",
      discordGuildName: "Guild One",
      createdBy: "u_creator",
      createdByDisplayName: "Creator",
      createdByAvatarUrl: "https://cdn.example.com/creator.png",
      winnerTeam: 1,
      resultStatus: "verified",
      createdAtMs: 1000,
      team1Realm: "Albion",
      team2Realm: "Midgard",
      players: [
        {
          discordUserId: "d1",
          displayName: "Player One",
          avatarUrl: "https://cdn.example.com/p1.png",
          team: 1,
          isCaptain: true,
        },
      ],
      bans: [{ team: 2, className: "Berserker" }],
    },
  ];
  const handlers = createDraftLogRouteHandlers({
    getRows: async () => rows,
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/drafts") as any
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { rows });
});

test("draft log endpoint returns 500 on runtime failure", async () => {
  const handlers = createDraftLogRouteHandlers({
    getRows: async () => {
      throw new Error("boom");
    },
  });
  const response = await handlers.GET(
    new Request("http://localhost/api/draft-stats/drafts") as any
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Failed to load draft log." });
});
