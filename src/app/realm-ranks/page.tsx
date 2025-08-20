import React from "react";
import { getRealmRanks } from "@/utils/character";

const estimated: Record<string, string> = {
  "16L1": "1,683,070,036",
  "16L2": "1,870,999,140",
  "16L3": "2,080,699,945",
  "16L4": "2,313,578,939",
  "16L5": "2,571,776,433",
  "16L6": "2,857,653,401",
  "16L7": "3,174,891,956",
  "16L8": "3,526,631,252",
  "16L9": "3,916,594,839",
  "17L0": "4,349,899,761",
  "17L1": "5,231,477,351",
  "17L2": "5,809,641,159",
  "17L3": "6,448,716,016",
  "17L4": "7,156,187,678",
  "17L5": "7,942,008,433",
  "17L6": "8,816,609,361",
  "17L7": "9,792,070,380",
  "17L8": "10,881,277,822",
  "17L9": "12,099,405,724",
  "18L0": "13,464,346,255",
  "18L1": "14,997,920,824",
  "18L2": "16,727,312,717",
  "18L3": "18,683,044,072",
  "18L4": "20,901,348,840",
  "18L5": "23,423,483,884",
  "18L6": "26,295,832,383",
  "18L7": "29,575,415,742",
  "18L8": "33,333,957,436",
  "18L9": "37,667,353,273",
  "19L0": "42,684,191,713",
};

function formatRankKey(numeric: number): string {
  const s = numeric.toString();
  return `${s.slice(0, -1)}L${s.slice(-1)}`;
}

export const metadata = {
  title: "Realm Ranks - divoxutils",
};

export default function RealmRanksPage() {
  const realmRanksMap = getRealmRanks();
  const toRows = (start: number, end: number) =>
    Array.from(realmRanksMap)
      .filter(([n]) => n >= start && n <= end)
      .map(([n, pts]) => ({ rank: formatRankKey(n), points: new Intl.NumberFormat().format(pts) }));

  const rowsActual = Array.from(realmRanksMap)
    .filter(([n]) => n >= 11 && n <= 160)
    .map(([n, pts]) => ({ rank: formatRankKey(n), points: new Intl.NumberFormat().format(pts) }));
  const estimatedRows = Object.entries(estimated).map(([rank, points]) => ({ rank, points }));

  const parseRankToNumeric = (key: string) => {
    const [major, minor] = key.split("L");
    return parseInt(major) * 10 + parseInt(minor);
  };
  const estimatedSorted = [...estimatedRows]
    .map(r => ({ ...r, numeric: parseRankToNumeric(r.rank) }))
    .sort((a, b) => b.numeric - a.numeric);
  const actualSorted = [...rowsActual]
    .map(r => ({ ...r, numeric: parseRankToNumeric(r.rank) }))
    .sort((a, b) => b.numeric - a.numeric);

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4 lg:py-12">
      <div className="container mx-auto max-w-4xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-12 rounded-2xl shadow-2xl space-y-6">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Realm Ranks</h1>
          <div className="h-1 w-32 bg-indigo-500 mx-auto rounded-full"></div>
        </header>
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
            <div className="bg-gray-800/60 border-b border-gray-700/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-indigo-300">Estimated Ranks (16L1+)</h3>
              <p className="text-xs text-gray-300 mt-1">Best-guess projections for extremely high ranks based on exponential progression with ~1.11× growth per rank.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Realm Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Realm Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {estimatedSorted.map(({ rank, points }, index) => (
                    <tr key={rank} className={`hover:bg-indigo-500/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-white">{rank}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-900/40 px-4 py-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-400">These values are not official.</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
            <div className="bg-gray-800/60 border-b border-gray-700/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-indigo-300">Realm Ranks (1L1 - 16L0)</h3>
            <p className="text-xs text-gray-300 mt-1">Official and calculated realm point requirements through 16L0.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Realm Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Realm Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {actualSorted.map(({ rank, points }, index) => (
                    <tr key={rank} className={`hover:bg-indigo-500/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-white">{rank}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


