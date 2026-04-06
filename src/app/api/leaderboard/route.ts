import { getLeaderboardData } from "@/server/leaderboard";
import { createLeaderboardRouteHandlers } from "@/server/api/leaderboardRouteHandlers";

const handlers = createLeaderboardRouteHandlers({
  getLeaderboardData,
});

export const GET = handlers.GET;
