import { getPlayerDraftDrilldownStats } from "@/server/draftStats";
import PlayerDrilldownClient from "./PlayerDrilldownClient";

export default async function PlayerDrilldownPage({
  params,
}: {
  params: { clerkUserId: string };
}) {
  const drilldown = await getPlayerDraftDrilldownStats(params.clerkUserId, {});

  return (
    <PlayerDrilldownClient
      initialData={drilldown}
    />
  );
}
