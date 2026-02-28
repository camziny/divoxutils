import { getOverallDraftStats } from "@/server/draftStats";
import LeaderboardClient from "./LeaderboardClient";

export const revalidate = 60;

export const metadata = {
  title: "Draft Leaderboard - divoxutils",
};

export default async function DraftLeaderboardPage() {
  const rows = await getOverallDraftStats({});

  return <LeaderboardClient initialRows={rows} />;
}
