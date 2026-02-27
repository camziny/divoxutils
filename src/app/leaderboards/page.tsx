import React from "react";
import LeaderboardWrapper from "@/app/components/LeaderboardWrapper";
import LeaderboardTooltip from "@/app/components/LeaderboardTooltip";
import { getLeaderboardData, type LeaderboardItem } from "@/server/leaderboard";

export const metadata = {
  title: "Leaderboards - divoxutils",
};

export const revalidate = 60;

async function fetchLeaderboardData(): Promise<LeaderboardItem[]> {
  try {
    return await getLeaderboardData();
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }
}

export default async function LeaderboardPage() {
  const leaderboardData = await fetchLeaderboardData();

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 px-6">
            <LeaderboardTooltip />
          </div>
          <LeaderboardWrapper data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
