import { getOverallDraftStats } from "@/server/draftStats";
import LeaderboardClient from "./_components/LeaderboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Draft leaderboard",
  description:
    "Dark Age of Camelot (DAoC) draft leaderboard on divoxutils. Compare overall draft performance across community players.",
  path: "/draft-history/leaderboard",
  openGraphTitle: "DAoC draft leaderboard — divoxutils",
});

export default async function DraftLeaderboardPage() {
  const rows = await getOverallDraftStats({});

  return <LeaderboardClient initialRows={rows} />;
}
