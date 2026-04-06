import { NextRequest, NextResponse } from "next/server";

type LeaderboardRouteDeps = {
  getLeaderboardData: () => Promise<unknown>;
};

export function createLeaderboardRouteHandlers(deps: LeaderboardRouteDeps) {
  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        const response = new NextResponse(
          `Method ${request.method} Not Allowed`,
          { status: 405 }
        );
        response.headers.set("Allow", "GET");
        return response;
      }

      try {
        const leaderboardData = await deps.getLeaderboardData();
        return NextResponse.json(leaderboardData);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        return NextResponse.json(
          { message: "Error fetching leaderboard data" },
          { status: 500 }
        );
      }
    },
  };
}
