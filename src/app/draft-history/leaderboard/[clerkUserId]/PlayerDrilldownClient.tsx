"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DraftPlayerDrilldown, WinLossRecord } from "@/server/draftStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DraftClassLeaderboardRow } from "@/server/draftStats";
import { allClasses } from "@/app/draft/constants";

const PIE_COLORS = ["#818cf8", "#374151"];

const REALM_BAR_COLOR: Record<string, string> = {
  Albion: "bg-red-500/30",
  Hibernia: "bg-green-500/30",
  Midgard: "bg-blue-500/30",
  PvP: "bg-indigo-500/30",
};

type ClassSortKey = "games" | "winRate" | "wins" | "losses";
type ClassView = "table" | "map";

export default function PlayerDrilldownClient({
  initialData,
}: {
  initialData: DraftPlayerDrilldown | null;
}) {
  const [opponentsOpen, setOpponentsOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [classSortBy, setClassSortBy] = useState<ClassSortKey>("winRate");
  const [classQuery, setClassQuery] = useState("");
  const [classView, setClassView] = useState<ClassView>("table");
  const [classPopulationRows, setClassPopulationRows] = useState<DraftClassLeaderboardRow[]>([]);
  const [classPopulationLoading, setClassPopulationLoading] = useState(false);
  const classRows = useMemo(
    () =>
      Object.entries(initialData?.byClass ?? {})
        .map(([className, stats]) => ({
          className,
          ...stats,
        }))
        .sort((a, b) => {
          if (b.games !== a.games) return b.games - a.games;
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return a.className.localeCompare(b.className);
        }),
    [initialData?.byClass]
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const filteredClassRows = useMemo(() => {
    const query = classQuery.trim().toLowerCase();
    const base = query
      ? classRows.filter((row) => row.className.toLowerCase().includes(query))
      : classRows;
    return [...base].sort((a, b) => {
      if (classSortBy === "winRate") {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.games !== a.games) return b.games - a.games;
      } else if (classSortBy === "losses") {
        if (b.losses !== a.losses) return b.losses - a.losses;
        if (b.games !== a.games) return b.games - a.games;
      } else if (classSortBy === "wins") {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.games !== a.games) return b.games - a.games;
      } else {
        if (b.games !== a.games) return b.games - a.games;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      }
      return a.className.localeCompare(b.className);
    });
  }, [classQuery, classRows, classSortBy]);

  useEffect(() => {
    if (!selectedClass || !allClasses.includes(selectedClass)) {
      if (allClasses.length > 0) {
        setSelectedClass(allClasses[0]);
      }
    }
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) {
      setClassPopulationRows([]);
      return;
    }
    let cancelled = false;
    setClassPopulationLoading(true);
    fetch(`/api/draft/class-leaderboard?className=${encodeURIComponent(selectedClass)}`)
      .then(async (response) => {
        if (!response.ok) return [] as DraftClassLeaderboardRow[];
        const data = (await response.json()) as { rows?: DraftClassLeaderboardRow[] };
        return Array.isArray(data.rows) ? data.rows : [];
      })
      .then((rows) => {
        if (cancelled) return;
        setClassPopulationRows(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setClassPopulationRows([]);
      })
      .finally(() => {
        if (cancelled) return;
        setClassPopulationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClass]);

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

  const streak = computeStreak(drilldown.recentGames);
  const classPopulationPoints = classPopulationRows
    .filter((row) => row.games > 0)
    .map((row, index) => ({
      rank: index + 1,
      rankLabel: `#${index + 1}`,
      userName: row.userName,
      clerkUserId: row.clerkUserId,
      avatarUrl: row.avatarUrl,
      isVerified: row.isVerified,
      wins: row.wins,
      losses: row.losses,
      games: row.games,
      winRate: row.winRate,
      isCurrentPlayer: row.clerkUserId === drilldown.playerClerkUserId,
    }))
    .sort((a, b) => a.rank - b.rank);
  const mapChartRows = (() => {
    const top = classPopulationPoints.slice(0, 15);
    const profile = classPopulationPoints.find((row) => row.isCurrentPlayer);
    if (!profile) return top;
    if (top.some((row) => row.clerkUserId === profile.clerkUserId)) return top;
    return [...top, profile];
  })();
  const profileMapRow = classPopulationPoints.find((row) => row.isCurrentPlayer) ?? null;
  const hasAnyClassDraftRows = classPopulationPoints.length > 0;

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
              {drilldown.isVerified ? <VerifiedCheck /> : null}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-gray-100">
                {drilldown.playerName}
              </h1>
              {drilldown.isVerified ? <VerifiedCheck /> : null}
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

      {allClasses.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 px-1 text-xs font-medium text-gray-500">
            Class Insights
          </h2>
          <Card className="mx-auto max-w-5xl bg-transparent">
            <CardHeader className="pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Class
                </CardTitle>
                <div className="inline-flex items-center gap-1 rounded border border-gray-800/80 bg-gray-900/40 p-1">
                  {([
                    { key: "table" as const, label: "Table" },
                    { key: "map" as const, label: "Rankings" },
                  ]).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setClassView(option.key)}
                      className={
                        classView === option.key
                          ? "rounded px-2 py-1 text-[11px] font-medium text-gray-200 bg-gray-800"
                          : "rounded px-2 py-1 text-[11px] text-gray-500 hover:text-gray-300"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {classView === "table" ? (
                  <Input
                    value={classQuery}
                    onChange={(event) => setClassQuery(event.target.value)}
                    placeholder="Search classes..."
                    className="h-8 w-full sm:w-[240px] border-gray-800 bg-gray-900 text-xs text-gray-200"
                  />
                ) : null}
                {classView === "table" ? (
                  <div className="inline-flex items-center gap-1 rounded border border-gray-800/80 bg-gray-900/40 p-1">
                    {([
                      { key: "winRate" as const, label: "Win %" },
                      { key: "wins" as const, label: "Wins" },
                      { key: "games" as const, label: "Fights" },
                      { key: "losses" as const, label: "Losses" },
                    ]).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setClassSortBy(option.key)}
                        className={
                          classSortBy === option.key
                            ? "rounded px-2 py-1 text-[11px] font-medium text-gray-200 bg-gray-800"
                            : "rounded px-2 py-1 text-[11px] text-gray-500 hover:text-gray-300"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {classView === "map" ? (
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-8 w-full sm:w-[220px] border-gray-800 bg-gray-900 text-xs text-gray-200">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {allClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>

              {classView === "table" && (
                <div className="rounded-md border border-gray-800/70 overflow-hidden">
                  <div className="grid grid-cols-[1fr_54px_54px_54px_54px] gap-1.5 border-b border-gray-800/70 bg-gray-900/60 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-600">
                    <span>Class</span>
                    <span className="text-right">Win %</span>
                    <span className="text-right">Wins</span>
                    <span className="text-right">Fights</span>
                    <span className="text-right">Losses</span>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    {filteredClassRows.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-gray-500">
                        No classes match your search.
                      </div>
                    ) : (
                      filteredClassRows.map((row) => (
                        <button
                          key={row.className}
                          type="button"
                          onClick={() => setSelectedClass(row.className)}
                          className={
                            row.className === selectedClass
                              ? "grid w-full grid-cols-[1fr_54px_54px_54px_54px] gap-1.5 bg-indigo-500/10 px-3 py-2 text-left"
                              : "grid w-full grid-cols-[1fr_54px_54px_54px_54px] gap-1.5 px-3 py-2 text-left hover:bg-gray-900/40"
                          }
                        >
                          <span className="truncate text-xs text-gray-200">{row.className}</span>
                          <span className="text-right text-xs tabular-nums text-gray-300">
                            {row.winRate.toFixed(1)}
                          </span>
                          <span className="text-right text-xs tabular-nums text-gray-300">
                            {row.wins}
                          </span>
                          <span className="text-right text-xs tabular-nums text-gray-500">
                            {row.games}
                          </span>
                          <span className="text-right text-xs tabular-nums text-gray-500">
                            {row.losses}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {classView === "map" && (
                <div className="space-y-2">
                  {!classPopulationLoading &&
                  hasAnyClassDraftRows &&
                  !profileMapRow &&
                  selectedClass ? (
                    <div className="rounded-md border border-gray-800/70 bg-gray-900/35 px-3 py-2 text-xs text-gray-500">
                      {drilldown.playerName} has no data for this class.
                    </div>
                  ) : null}
                  <div className="rounded-md border border-gray-800/70 bg-gray-900/30 p-2">
                    {classPopulationLoading ? (
                      <div className="flex h-[300px] items-center justify-center text-xs text-gray-500">
                        Loading class rankings...
                      </div>
                    ) : classPopulationPoints.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-xs text-gray-500">
                        No data for this class yet.
                      </div>
                    ) : (
                      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                        {mapChartRows.map((row) => (
                          <div
                            key={`rank-row-${row.clerkUserId}-${row.rank}`}
                            className={
                              row.isCurrentPlayer
                                ? "rounded border border-indigo-400/30 bg-indigo-500/10 px-2 py-2"
                                : "rounded px-2 py-2 hover:bg-gray-900/35"
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <span className="w-7 text-right text-[11px] tabular-nums text-gray-500">
                                  #{row.rank}
                                </span>
                                <InlineMiniAvatar
                                  name={row.userName}
                                  avatarUrl={row.avatarUrl}
                                />
                                {row.isVerified ? (
                                  <Link
                                    href={`/draft-history/leaderboard/${encodeURIComponent(
                                      row.clerkUserId
                                    )}`}
                                    className="truncate text-[11px] text-gray-300 hover:text-white"
                                  >
                                    {row.userName}
                                  </Link>
                                ) : (
                                  <span className="truncate text-[11px] text-gray-400">
                                    {row.userName}
                                  </span>
                                )}
                              </span>
                              <span className="inline-flex flex-col items-end leading-tight">
                                <span className="whitespace-nowrap text-[11px] tabular-nums text-gray-300">
                                  {row.winRate.toFixed(1)}%
                                </span>
                                <span className="whitespace-nowrap text-[10px] tabular-nums text-gray-500">
                                  {row.wins}-{row.losses}
                                </span>
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <Progress
                                value={row.winRate}
                                className="h-2"
                                indicatorClassName={
                                  row.isCurrentPlayer ? "bg-indigo-400/90" : "bg-indigo-400/65"
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {topH2H.length > 0 && (
        <Card className="mb-6 bg-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Head-to-Head
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {topH2H.map((row) => (
                <div
                  key={row.opponentClerkUserId}
                  className="grid grid-cols-[1fr_1fr_44px] items-center gap-2"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <InlineMiniAvatar
                      name={row.opponentName}
                      avatarUrl={row.opponentAvatarUrl}
                    />
                    {row.opponentIsVerified ? (
                      <Link
                        href={`/draft-history/leaderboard/${encodeURIComponent(
                          row.opponentClerkUserId
                        )}`}
                        className="truncate text-xs text-gray-300 hover:text-white"
                      >
                        {row.opponentName}
                      </Link>
                    ) : (
                      <span className="truncate text-xs text-gray-400">
                        {row.opponentName}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={row.winRate}
                      className="h-1.5 flex-1"
                      indicatorClassName="bg-indigo-400/60"
                    />
                    <span className="text-[11px] text-gray-500 tabular-nums">
                      {row.wins}-{row.losses}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 tabular-nums text-right">
                    {row.winRate.toFixed(1)}%
                  </span>
                </div>
              ))}
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
              {drilldown.headToHead.map((row) => {
                const rowContent = (
                  <>
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <InlineMiniAvatar
                        name={row.opponentName}
                        avatarUrl={row.opponentAvatarUrl}
                      />
                      <span className="truncate text-sm text-gray-300 group-hover:text-white transition-colors duration-100">
                        {row.opponentName}
                      </span>
                    </span>
                    <div className="flex items-center gap-3 text-sm tabular-nums">
                      <span className="text-gray-300 font-medium">
                        {row.wins}-{row.losses}
                      </span>
                      <span className="text-gray-600 w-12 text-right text-xs">
                        {row.winRate.toFixed(1)}%
                      </span>
                      {row.opponentIsVerified ? (
                        <ChevronRight className="w-3 h-3 text-gray-700 group-hover:text-gray-500 transition-colors duration-100" />
                      ) : null}
                    </div>
                  </>
                );

                if (!row.opponentIsVerified) {
                  return (
                    <div
                      key={row.opponentClerkUserId}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      {rowContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={row.opponentClerkUserId}
                    href={`/draft-history/leaderboard/${row.opponentClerkUserId}`}
                    className="group flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/20 transition-colors duration-100"
                  >
                    {rowContent}
                  </Link>
                );
              })}
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

function InlineMiniAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={16}
        height={16}
        className="h-4 w-4 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-gray-500">
      <User className="h-2.5 w-2.5" />
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
      <span className="text-sm text-gray-300 w-28 truncate">{label}</span>
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
