import { allClasses } from "@/app/draft/constants";
import {
  getClassDraftStats,
  getOverallDraftStats,
} from "@/server/draftStats";
import type { DraftLeaderboardRow } from "@/server/draftLeaderboard";
import LeaderboardClient from "./LeaderboardClient";

export const revalidate = 60;

export const metadata = {
  title: "Draft Leaderboard - divoxutils",
};

export default async function DraftLeaderboardPage({
  searchParams,
}: {
  searchParams?: { class?: string };
}) {
  const requestedClass = searchParams?.class;
  const selectedClass =
    requestedClass && allClasses.includes(requestedClass)
      ? requestedClass
      : "all";

  let rows: DraftLeaderboardRow[];
  if (selectedClass === "all") {
    rows = await getOverallDraftStats({});
  } else {
    const classRows = await getClassDraftStats(selectedClass, {});
    rows = classRows.map((row) => ({
      id: row.clerkUserId,
      clerkUserId: row.clerkUserId,
      isVerified: row.isVerified,
      userName: row.userName,
      avatarUrl: row.avatarUrl,
      wins: row.wins,
      losses: row.losses,
      games: row.games,
      winRate: row.winRate,
      captainWins: 0,
      captainLosses: 0,
      captainGames: 0,
      captainWinRate: 0,
    }));
  }

  return (
    <LeaderboardClient
      initialRows={rows}
      classOptions={allClasses}
      selectedClass={selectedClass}
    />
  );
}
