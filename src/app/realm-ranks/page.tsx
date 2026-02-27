import React from "react";
import EstimatedInfoDialog from "./EstimatedInfoDialog";
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

  const rowsActual = Array.from(realmRanksMap)
    .filter(([n]) => n >= 11 && n <= 140)
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
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-16">
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Realm Ranks
          </h1>
        </header>

        <div className="space-y-12">
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Estimated Ranks</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Best-guess projections based on exponential progression with
                ~1.11× growth per rank.
              </p>
              <EstimatedInfoDialog />
            </div>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Rank</th>
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Points</th>
                  </tr>
                </thead>
                <tbody>
                  {estimatedSorted.map(({ rank, points }, index) => (
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
            <p className="text-xs text-gray-600">These values are not official.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Realm Ranks</h2>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Rank</th>
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Realm Points</th>
                  </tr>
                </thead>
                <tbody>
                  {actualSorted.map(({ rank, points }, index) => (
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
          </section>
        </div>
      </div>
    </div>
  );
}
