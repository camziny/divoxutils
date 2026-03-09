import { getPlayerDraftDrilldownStats } from "@/server/draftStats";
import { getClerkUserIdFromLeaderboardParam } from "@/lib/draftHistoryLeaderboardPath";
import PlayerDrilldownClient from "./PlayerDrilldownClient";

export const revalidate = 60;

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
