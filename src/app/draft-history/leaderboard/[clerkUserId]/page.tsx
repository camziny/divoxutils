import type { Metadata } from "next";
import { getPlayerDraftDrilldownStats } from "@/server/draftStats";
import { getClerkUserIdFromLeaderboardParam } from "@/lib/draftHistoryLeaderboardPath";
import PlayerDrilldownClient from "./_components/PlayerDrilldownClient";
import { NOINDEX_METADATA } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Draft player stats",
  ...NOINDEX_METADATA,
};

export default async function PlayerDrilldownPage({
  params,
}: {
  params: { clerkUserId: string };
}) {
  const playerId = getClerkUserIdFromLeaderboardParam(params.clerkUserId);
  const drilldown = await getPlayerDraftDrilldownStats(playerId, {});

  return (
    <PlayerDrilldownClient
      initialData={drilldown}
    />
  );
}
