import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Draft Leaderboard - divoxutils",
};

export const dynamic = "force-dynamic";

export default function DraftLeaderboardPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <LeaderboardClient />
    </div>
  );
}
