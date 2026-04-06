import test from "node:test";
import assert from "node:assert/strict";
import { createLeaderboardRouteHandlers } from "../src/server/api/leaderboardRouteHandlers";

test("leaderboard GET returns data", async () => {
  const handlers = createLeaderboardRouteHandlers({
    getLeaderboardData: async () => [{ id: 1 }],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/leaderboard") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: 1 }]);
});

test("leaderboard GET returns 500 when getLeaderboardData throws", async () => {
  const handlers = createLeaderboardRouteHandlers({
    getLeaderboardData: async () => {
      throw new Error("db failure");
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/leaderboard") as any
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    message: "Error fetching leaderboard data",
  });
});

test("leaderboard GET returns 405 for non-GET", async () => {
  const handlers = createLeaderboardRouteHandlers({
    getLeaderboardData: async () => [],
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/leaderboard", { method: "POST" }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
