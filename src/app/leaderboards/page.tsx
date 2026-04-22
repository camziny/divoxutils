import React from "react";
import type { Metadata } from "next";
import LeaderboardWrapper from "./_components/LeaderboardWrapper";
import LeaderboardTooltip from "./_components/LeaderboardTooltip";
import EventScheduleBanner from "./_components/EventScheduleBanner";
import { getLeaderboardData, type LeaderboardItem } from "@/server/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboards - divoxutils",
  description:
    "Browse divoxutils leaderboards to see top players, rankings, and progress across the DAoC community.",
  alternates: {
    canonical: "https://divoxutils.com/leaderboards",
  },
  openGraph: {
    title: "Leaderboards - divoxutils",
    description:
      "See top players and rankings on the divoxutils leaderboards.",
    url: "https://divoxutils.com/leaderboards",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboards - divoxutils",
    description: "See top players and rankings on the divoxutils leaderboards.",
    images: ["/wh-big.png"],
  },
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
  const lastCompletedAt = leaderboardData.reduce<Date | null>((latest, item) => {
    if (!item.lastUpdated) return latest;
    const current = new Date(item.lastUpdated);
    if (!latest || current > latest) return current;
    return latest;
  }, null);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 px-6">
            <LeaderboardTooltip />
            <EventScheduleBanner lastCompletedAt={lastCompletedAt} />
          </div>
          <LeaderboardWrapper data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
