import React from "react";
import LeaderboardList from "@/app/components/LeaderboardList";
import LeaderboardTooltip from "@/app/components/LeaderboardTooltip";

async function fetchLeaderboardData() {
  try {
    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/leaderboard?timestamp=${new Date().getTime()}`;
    const response = await fetch(apiUrl);

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
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-lg mx-auto text-center">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2">
          Leaderboards
        </h1>
        <div className="mb-4">
          <LeaderboardTooltip />
        </div>
        <LeaderboardList data={leaderboardData} />
      </div>
    </div>
  );
}
