import {
  getDraftLeaderboardRows,
  type DraftLeaderboardRow,
} from "@/server/draftLeaderboard";

export const metadata = {
  title: "Draft History - divoxutils",
};

export const revalidate = 60;

export default async function DraftHistoryPage() {
  let rows: DraftLeaderboardRow[] = [];
  let loadError: string | null = null;

  try {
    rows = await getDraftLeaderboardRows();
  } catch (error) {
    console.error("Failed to load draft history leaderboard", error);
    loadError = "Unable to load draft history right now.";
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
            Draft History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Records include verified drafts only.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-md border border-gray-800 px-4 py-6 text-sm text-red-400">
            {loadError}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-gray-800 px-4 py-6 text-sm text-gray-500">
            No verified draft records yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-800 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-right font-medium">W</th>
                  <th className="px-3 py-2 text-right font-medium">L</th>
                  <th className="px-3 py-2 text-right font-medium">Win %</th>
                  <th className="px-3 py-2 text-right font-medium">Cap W</th>
                  <th className="px-3 py-2 text-right font-medium">Cap L</th>
                  <th className="px-3 py-2 text-right font-medium">Cap Win %</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.clerkUserId} className="border-b border-gray-800/70">
                    <td className="px-3 py-2 text-gray-200">{row.userName}</td>
                    <td className="px-3 py-2 text-right">{row.wins}</td>
                    <td className="px-3 py-2 text-right">{row.losses}</td>
                    <td className="px-3 py-2 text-right">{row.winRate.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{row.captainWins}</td>
                    <td className="px-3 py-2 text-right">{row.captainLosses}</td>
                    <td className="px-3 py-2 text-right">
                      {row.captainWinRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
