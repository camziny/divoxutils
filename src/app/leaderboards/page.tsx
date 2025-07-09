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
    
    console.log("Fetching from API URL:", apiUrl);
    console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
    
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 60,
        tags: ['leaderboard']
      }
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch leaderboard data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("First user from API:", data[0]);
    console.log("Death blows fields present:", {
      totalDeathBlows: data[0]?.totalDeathBlows !== undefined,
      deathBlowsLastWeek: data[0]?.deathBlowsLastWeek !== undefined,
      deathBlowsThisWeek: data[0]?.deathBlowsThisWeek !== undefined
    });
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
