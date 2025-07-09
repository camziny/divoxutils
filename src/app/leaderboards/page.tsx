import React from "react";
import LeaderboardWrapper from "@/app/components/LeaderboardWrapper";
import LeaderboardTooltip from "@/app/components/LeaderboardTooltip";

export const metadata = {
  title: "Leaderboards - divoxutils",
};

async function fetchLeaderboardData() {
  try {
    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/leaderboard`;
    const response = await fetch(apiUrl, {
      cache: 'no-store' // Disable caching temporarily
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch leaderboard data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
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
        <div className="max-w-screen-lg mx-auto text-center">
          <div className="mb-6">
            <LeaderboardTooltip />
          </div>
          <LeaderboardWrapper data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
