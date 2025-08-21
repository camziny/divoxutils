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
          <div className="relative z-10 w-[98%] sm:w-[760px] max-w-3xl rounded-xl border border-gray-700/40 bg-gray-900/95 shadow-2xl">
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
              <p>Projections extend the observed exponential growth in rank cost (~1.11× per step) beyond the last official rank.</p>
              <ChartPreview />
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-300">At the cutoff, the acceleration in rank cost looks like this:</p>
                <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-800/60 text-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Rank</th>
                          <th className="px-3 py-2 text-left font-semibold">Total RP</th>
                          <th className="px-3 py-2 text-left font-semibold">A: Jump in Points</th>
                          <th className="px-3 py-2 text-left font-semibold">B: Growth of Jump</th>  
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-300">
                        <tr>
                          <td className="px-3 py-2">13L8</td>
                          <td className="px-3 py-2">152,517,769</td>
                          <td className="px-3 py-2">15,114,374</td>
                          <td className="px-3 py-2">—</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">13L9</td>
                          <td className="px-3 py-2">169,294,723</td>
                          <td className="px-3 py-2">16,776,954</td>
                          <td className="px-3 py-2">1,662,580</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">14L0</td>
                          <td className="px-3 py-2">187,917,143</td>
                          <td className="px-3 py-2">18,622,420</td>
                          <td className="px-3 py-2">1,845,466</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span>Growth ratio ≈</span>
                    <code className="rounded bg-gray-800/70 px-1.5 py-0.5 text-gray-200 border border-gray-700/50">1,845,466 ÷ 1,662,580 ≈ 1.11</code>
                  </div>
                  <p className="mt-1">Applying ~1.11 forward yields 14L1+ estimates.</p>
                </div>
              </div>
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

  const maxPoints = data.length ? Math.max(...data.map((d) => d.points)) : 0;
  const computedMax = Math.ceil((maxPoints * 1.1) / 100_000_000) * 100_000_000;
  const yMax = Math.max(1_600_000_000, computedMax);

  const [isMdUp, setIsMdUp] = React.useState(false); 
  const [isXsNarrow, setIsXsNarrow] = React.useState(false); 
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mqMd = window.matchMedia("(min-width: 768px)");
    const mqXsNarrow = window.matchMedia("(max-width: 419px)");
    const update = () => {
      setIsMdUp(mqMd.matches);
      setIsXsNarrow(mqXsNarrow.matches);
    };
    update();
    mqMd.addEventListener?.("change", update);
    mqXsNarrow.addEventListener?.("change", update);
    return () => {
      mqMd.removeEventListener?.("change", update);
      mqXsNarrow.removeEventListener?.("change", update);
    };
  }, []);

  const isMobile = !isMdUp;
  const majorTickLabels = ["11L1", "12L0", "13L0", "14L0", "15L0", "16L0"].filter((t) => data.some((d) => d.rank === t));
  const getTicksForMode = () => {
    if (isMobile) {
      if (isXsNarrow) return majorTickLabels.filter((t) => t === "14L0" || t === "16L0");
      return majorTickLabels.filter((t) => t === "12L0" || t === "14L0" || t === "16L0");
    }
    return majorTickLabels; 
  };

  const formatCompact = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
    return v.toLocaleString();
  };

  return (
    <div className="mt-2 rounded-lg border border-gray-700/50 bg-gray-900/60 p-3">
      <ChartContainer className="w-full">
        <div className="w-full">
          <div className="h-[240px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: isMobile ? 8 : 24, bottom: isMobile ? 10 : 16 }}>
                <CartesianGrid stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="rank"
                  height={isMobile ? 28 : 24}
                  interval={0}
                  ticks={getTicksForMode()}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  angle={0}
                  tickMargin={0}
                  tickLine={false}
                  axisLine={{ stroke: "#4B5563" }}
                />
                <YAxis
                  width={isMobile ? 28 : 56}
                  domain={[0, yMax]}
                  tickCount={isMobile ? 4 : 6}
                  allowDecimals={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickFormatter={(v: number) => (isMobile ? formatCompact(v) : Number(v).toLocaleString())}
                  tickLine={false}
                  axisLine={{ stroke: "#4B5563" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="points" radius={[3, 3, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={`cell-${i}`} fill={d.segment === "Estimated" ? "#818cf8" : "#4f46e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-0.5 bg-indigo-600"></span> 11L1–14L0</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-0.5 bg-indigo-300"></span> Estimated 14L1–16L0</div>
        </div>
      </ChartContainer>
    </div>
  );
};


