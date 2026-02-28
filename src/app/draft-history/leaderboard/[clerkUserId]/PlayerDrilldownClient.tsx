"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, User } from "lucide-react";
import type { DraftPlayerDrilldown, WinLossRecord } from "@/server/draftStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PIE_COLORS = ["#818cf8", "#374151"];

const REALM_BAR_COLOR: Record<string, string> = {
  Albion: "bg-red-500/30",
  Hibernia: "bg-green-500/30",
  Midgard: "bg-blue-500/30",
  PvP: "bg-indigo-500/30",
};

export default function PlayerDrilldownClient({
  initialData,
}: {
  initialData: DraftPlayerDrilldown | null;
}) {
  const [opponentsOpen, setOpponentsOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  if (!initialData) {
    return (
      <>
        <BackNav />
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No verified draft data found for this player.
        </div>
      </>
    );
  }

  const drilldown = initialData;

  const overallPie = [
    { name: "Wins", value: drilldown.overall.wins },
    { name: "Losses", value: drilldown.overall.losses },
  ];
  const captainPie = [
    { name: "Wins", value: drilldown.captain.wins },
    { name: "Losses", value: drilldown.captain.losses },
  ];

  const topH2H = drilldown.headToHead.slice(0, 8);
  const h2hBarData = topH2H.map((row) => ({
    name:
      row.opponentName.length > 10
        ? row.opponentName.slice(0, 9) + "\u2026"
        : row.opponentName,
    wins: row.wins,
    losses: row.losses,
  }));
  const h2hChartHeight = Math.max(64, h2hBarData.length * 24);

  const streak = computeStreak(drilldown.recentGames);

  return (
    <>
      <BackNav />

      <div className="mb-8 flex items-center gap-3">
        <PlayerAvatar name={drilldown.playerName} avatarUrl={drilldown.avatarUrl} />
        <div>
          {drilldown.profileName ? (
            <div className="inline-flex items-center gap-1.5">
              <Link
                href={`/user/${drilldown.profileName}/characters`}
                className="text-xl font-semibold tracking-tight text-gray-100 hover:text-indigo-400 transition-colors duration-100"
              >
                {drilldown.playerName}
              </Link>
              <VerifiedCheck />
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-gray-100">
                {drilldown.playerName}
              </h1>
              <VerifiedCheck />
            </div>
          )}
          <p className="mt-1 text-[13px] text-gray-500">
            {drilldown.overall.games} verified draft
            {drilldown.overall.games !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <StatCard
          label="Overall"
          data={overallPie}
          record={`${drilldown.overall.wins}-${drilldown.overall.losses}`}
          winRate={drilldown.overall.winRate}
        />
        {drilldown.captain.games > 0 ? (
          <StatCard
            label="As Captain"
            data={captainPie}
            record={`${drilldown.captain.wins}-${drilldown.captain.losses}`}
            winRate={drilldown.captain.winRate}
          />
        ) : (
          <Card className="bg-transparent">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-gray-500">
                As Captain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">No captained drafts yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {(Object.keys(drilldown.byRealm).length > 0 || drilldown.pvp.games > 0) && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 mb-2 px-1">
            Breakdown
          </h2>
          <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
            {drilldown.pvp.games > 0 && (
              <BreakdownRow
                label="PvP"
                barClass={REALM_BAR_COLOR["PvP"]}
                stats={drilldown.pvp}
              />
            )}
            {Object.entries(drilldown.byRealm)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([realm, stats]) => (
                <BreakdownRow
                  key={realm}
                  label={realm}
                  barClass={REALM_BAR_COLOR[realm] ?? "bg-gray-500/30"}
                  stats={stats}
                />
              ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs text-gray-500">Streak</span>
        <div className="flex gap-0.5">
          {drilldown.recentGames.slice(0, 10).map((game, i) => (
            <div
              key={`${game.shortId}-${i}`}
              className={`w-5 h-5 rounded-[3px] flex items-center justify-center text-[9px] font-semibold ${
                game.didWin
                  ? "bg-indigo-500/25 text-indigo-300"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {game.didWin ? "W" : "L"}
            </div>
          ))}
        </div>
        {streak.count > 0 && (
          <span className="text-xs text-gray-500">
            {streak.count}{streak.type}
          </span>
        )}
      </div>

      {h2hBarData.length > 0 && (
        <Card className="mb-6 bg-transparent">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">
              Head-to-Head
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: `${h2hChartHeight}px` }}>
              <ChartContainer className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={h2hBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                      }}
                      content={({ label, payload }) => (
                        <ChartTooltipContent
                          label={typeof label === "string" ? label : undefined}
                          payload={payload as any}
                        />
                      )}
                    />
                    <Bar
                      dataKey="wins"
                      name="Wins"
                      fill="#818cf8"
                      radius={[0, 3, 3, 0]}
                      stackId="s"
                      barSize={10}
                    />
                    <Bar
                      dataKey="losses"
                      name="Losses"
                      fill="#374151"
                      radius={[0, 3, 3, 0]}
                      stackId="s"
                      barSize={10}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {drilldown.headToHead.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setOpponentsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2 px-1 hover:text-gray-400 transition-colors duration-100"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                opponentsOpen ? "" : "-rotate-90"
              }`}
            />
            vs Opponents
            <span className="text-gray-600 font-normal">
              ({drilldown.headToHead.length})
            </span>
          </button>
          {opponentsOpen && (
            <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
              {drilldown.headToHead.map((row) => (
                <Link
                  key={row.opponentClerkUserId}
                  href={`/draft-history/leaderboard/${row.opponentClerkUserId}`}
                  className="group flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/20 transition-colors duration-100"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-100">
                    {row.opponentName}
                  </span>
                  <div className="flex items-center gap-3 text-sm tabular-nums">
                    <span className="text-gray-300 font-medium">
                      {row.wins}-{row.losses}
                    </span>
                    <span className="text-gray-600 w-12 text-right text-xs">
                      {row.winRate.toFixed(1)}%
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-700 group-hover:text-gray-500 transition-colors duration-100" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {drilldown.recentGames.length > 0 && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setRecentOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2 px-1 hover:text-gray-400 transition-colors duration-100"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                recentOpen ? "" : "-rotate-90"
              }`}
            />
            Recent Drafts
            <span className="text-gray-600 font-normal">
              ({drilldown.recentGames.length})
            </span>
          </button>
          {recentOpen && (
            <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
              {drilldown.recentGames.map((game, i) => (
                <div
                  key={`${game.shortId}-${i}`}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold w-4 text-center ${
                        game.didWin ? "text-gray-200" : "text-gray-600"
                      }`}
                    >
                      {game.didWin ? "W" : "L"}
                    </span>
                    <span className="text-sm text-gray-400">
                      {game.team1CaptainName}
                      <span className="text-gray-600 mx-1.5">vs</span>
                      {game.team2CaptainName}
                    </span>
                    {game.wasCaptain && (
                      <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                        C
                      </span>
                    )}
                    {game.playerRealm && (
                      <span className="text-[10px] text-gray-600 font-medium tracking-wider">
                        {game.playerRealm}
                      </span>
                    )}
                    {game.draftType === "pvp" && (
                      <span className="text-[10px] text-gray-600 font-medium tracking-wider">
                        PvP
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(game.createdAtMs).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function BackNav() {
  return (
    <div className="mb-6">
      <Link
        href="/draft-history/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors duration-100"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Leaderboard
      </Link>
    </div>
  );
}

function PlayerAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400">
      <User className="h-5 w-5" />
    </span>
  );
}

function StatCard({
  label,
  data,
  record,
  winRate,
}: {
  label: string;
  data: Array<{ name: string; value: number }>;
  record: string;
  winRate: number;
}) {
  return (
    <Card className="bg-transparent">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <MiniDonut data={data} />
          <div>
            <p className="text-xl font-semibold text-gray-100 tabular-nums">
              {record}
            </p>
            <p className="text-xs text-gray-500 tabular-nums">
              {winRate.toFixed(1)}% win rate
            </p>
          </div>
        </div>
        <Progress
          value={winRate}
          className="mt-3 h-1"
          indicatorClassName="bg-indigo-400/60"
        />
      </CardContent>
    </Card>
  );
}

function MiniDonut({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="w-14 h-14 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={16}
            outerRadius={24}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownRow({
  label,
  barClass,
  stats,
}: {
  label: string;
  barClass: string;
  stats: WinLossRecord;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-sm text-gray-300 w-20">{label}</span>
      <span className="text-sm text-gray-100 font-medium tabular-nums">
        {stats.wins}-{stats.losses}
      </span>
      <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{
            width: `${Math.min(100, Math.max(0, stats.winRate))}%`,
          }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
        {stats.winRate.toFixed(1)}%
      </span>
    </div>
  );
}

function computeStreak(
  games: Array<{ didWin: boolean }>
): { type: "W" | "L"; count: number } {
  if (games.length === 0) return { type: "W", count: 0 };
  const first = games[0].didWin;
  let count = 0;
  for (const game of games) {
    if (game.didWin === first) count += 1;
    else break;
  }
  return { type: first ? "W" : "L", count };
}

function VerifiedCheck() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center flex-shrink-0 cursor-default">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span>Verified</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
