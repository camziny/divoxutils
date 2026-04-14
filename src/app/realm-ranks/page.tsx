import React from "react";
import { OFFICIAL_REALM_RANK_MAX, getRealmRanks } from "@/utils/character";

function formatRankKey(numeric: number): string {
  const s = numeric.toString();
  return `${s.slice(0, -1)}L${s.slice(-1)}`;
}

function parseRankToNumeric(key: string): number {
  const [major, minor] = key.split("L");
  return parseInt(major, 10) * 10 + parseInt(minor, 10);
}

export const metadata = {
  title: "Realm Ranks - divoxutils",
};

export default function RealmRanksPage() {
  const realmRanksMap = getRealmRanks();
  const rows = Array.from(realmRanksMap)
    .filter(([n]) => n >= 11)
    .map(([n, pts]) => ({
      rank: formatRankKey(n),
      points: new Intl.NumberFormat().format(pts),
    }));
  const officialRows = rows.filter(
    ({ rank }) => parseRankToNumeric(rank) <= OFFICIAL_REALM_RANK_MAX
  );
  const officialSorted = [...officialRows]
    .map(r => ({ ...r, numeric: parseRankToNumeric(r.rank) }))
    .sort((a, b) => b.numeric - a.numeric);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-16">
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Realm Ranks
          </h1>
        </header>

        <div className="space-y-12">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Official Realm Ranks</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Realm points are capped at 2,000,000,000.
            </p>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Rank</th>
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Points</th>
                  </tr>
                </thead>
                <tbody>
                  {officialSorted.map(({ rank, points }, index) => (
                    <tr
                      key={rank}
                      className={`border-b border-gray-800/50 transition-colors hover:bg-indigo-500/10 ${
                        index % 2 === 0 ? "bg-gray-800/30" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-white">{rank}</td>
                      <td className="px-4 py-2.5 text-gray-400">{points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600">
              Patch 1.130a also caps realm points at 2,000,000,000.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
