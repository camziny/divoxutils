"use client";
import React from "react";
import { getRealmRanks } from "@/utils/character";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const EstimatedInfoDialog: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-indigo-300 hover:text-indigo-200 underline"
      >
        Learn more
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-[92%] sm:w-[560px] max-w-xl rounded-xl border border-gray-700/40 bg-gray-900/95 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <h4 className="text-sm font-semibold text-gray-100 m-0">About Estimated Ranks</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 text-sm text-gray-200 space-y-3">
              <p>
                This is a best-guess projection based on a close look at the existing realm point values.
              </p>
              <p>
                The official realm rank data shows a clear exponential curve with a consistent growth factor of a 1.11 ratio for each rank.
              </p>
              <p>
                These projections are simply the result of extending that consistent pattern. 
              </p>
              <ChartPreview />
            </div>
            <div className="px-4 py-3 border-t border-gray-700/50 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimatedInfoDialog;

const ChartPreview: React.FC = () => {
  const ranks = Array.from(getRealmRanks())
    .filter(([n]) => n >= 111 && n <= 160)
    .map(([n, pts]) => ({ n, pts }))
    .sort((a, b) => a.n - b.n);

  const formatRankKey = (numeric: number) => {
    const s = numeric.toString();
    return `${s.slice(0, -1)}L${s.slice(-1)}`;
  };

  const data = ranks.map((r) => ({
    rank: formatRankKey(r.n),
    points: r.pts,
    segment: r.n >= 141 ? "Estimated" : "Known",
  }));

  return (
    <div className="mt-2 rounded-lg border border-gray-700/50 bg-gray-900/60 p-3">
      <ChartContainer className="w-full">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#374151" vertical={false} />
              <XAxis dataKey="rank" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval={4} tickLine={false} axisLine={{ stroke: "#4B5563" }} />
              <YAxis domain={[0, 'auto']} tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v: number) => Number(v).toLocaleString()} tickLine={false} axisLine={{ stroke: "#4B5563" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="points" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={`cell-${i}`} fill={d.segment === "Estimated" ? "#818cf8" : "#4f46e5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-0.5 bg-indigo-600"></span> 11L1–14L0</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-0.5 bg-indigo-300"></span> Estimated 14L1–16L0</div>
        </div>
      </ChartContainer>
    </div>
  );
};


