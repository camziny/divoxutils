import React from "react";
import { getRealmRanks } from "@/utils/character";

const estimated: Record<string, string> = {
  "14L1": "208,588,033",
  "14L2": "231,532,727",
  "14L3": "257,001,346",
  "14L4": "285,271,524",
  "14L5": "316,651,435",
  "14L6": "351,483,152",
  "14L7": "390,146,276",
  "14L8": "433,062,164",
  "14L9": "480,698,522",
  "15L0": "533,574,504",
  "15L1": "592,266,371",
  "15L2": "657,413,773",
  "15L3": "729,726,722",
  "15L4": "809,993,331",
  "15L5": "899,088,405",
  "15L6": "997,982,978",
  "15L7": "1,107,754,898",
  "15L8": "1,229,600,576",
  "15L9": "1,364,848,028",
  "16L0": "1,514,971,352",
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
              <h3 className="text-sm font-semibold text-indigo-300">Estimated Ranks (14L1 - 16L0)</h3>
              <p className="text-xs text-gray-300 mt-1">Best-guess projections from 14L1 through the cap of 16L0.</p>
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


