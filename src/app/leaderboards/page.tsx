import React from "react";
import type { Metadata } from "next";
import LeaderboardWrapper from "./_components/LeaderboardWrapper";
import LeaderboardTooltip from "./_components/LeaderboardTooltip";
import EventScheduleBanner from "./_components/EventScheduleBanner";
import { getLeaderboardData, type LeaderboardItem } from "@/server/leaderboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Leaderboards",
  description:
    "Dark Age of Camelot (DAoC) community leaderboards on divoxutils. Compare realm points, rankings, and character progress across tracked players.",
  path: "/leaderboards",
  openGraphTitle: "DAoC leaderboards — divoxutils",
});

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
            <EventScheduleBanner />
          </div>
          <LeaderboardWrapper data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
