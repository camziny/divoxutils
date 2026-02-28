import { getPlayerDraftDrilldownStats } from "@/server/draftStats";
import PlayerDrilldownClient from "./PlayerDrilldownClient";

function decodePlayerId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PlayerDrilldownPage({
  params,
}: {
  params: { clerkUserId: string };
}) {
  const playerId = decodePlayerId(params.clerkUserId);
  const drilldown = await getPlayerDraftDrilldownStats(playerId, {});

  return (
    <PlayerDrilldownClient
      initialData={drilldown}
    />
  );
}
