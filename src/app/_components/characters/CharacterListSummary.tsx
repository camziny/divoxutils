"use client";

import React from "react";
import Link from "next/link";
import { getRealmSurfaceClass } from "./characterTileTheme";
import RecentActivity from "./RecentActivity";
import type { CharacterData } from "@/utils/character";

interface RealmStats {
  kills: number;
  death_blows: number;
  solo_kills: number;
  realmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
}

interface AggregateStats {
  Albion: RealmStats;
  Hibernia: RealmStats;
  Midgard: RealmStats;
  Total: RealmStats;
  [key: string]: RealmStats;
}

interface LeaderboardItem {
  userId: number;
  clerkUserId: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalKills: number;
  killsLastWeek: number;
  killsThisWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  soloKillsThisWeek: number;
  totalDeathBlows: number;
  deathBlowsLastWeek: number;
  deathBlowsThisWeek: number;
}

type Metric = "realmPoints" | "kills" | "soloKills" | "deathBlows";
type Period = "total" | "lastWeek" | "thisWeek";

const LEADERBOARD_ITEMS_PER_PAGE = 15;

const METRIC_MAP: Record<keyof RealmStats, { metric: Metric; period: Period }> = {
  kills: { metric: "kills", period: "total" },
  death_blows: { metric: "deathBlows", period: "total" },
  solo_kills: { metric: "soloKills", period: "total" },
  realmPoints: { metric: "realmPoints", period: "total" },
  realmPointsLastWeek: { metric: "realmPoints", period: "lastWeek" },
  realmPointsThisWeek: { metric: "realmPoints", period: "thisWeek" },
};

const initialRealmStats = (): RealmStats => ({
  kills: 0,
  death_blows: 0,
  solo_kills: 0,
  realmPoints: 0,
  realmPointsLastWeek: 0,
  realmPointsThisWeek: 0,
});

const initialAggregateStats = (): AggregateStats => ({
  Albion: initialRealmStats(),
  Hibernia: initialRealmStats(),
  Midgard: initialRealmStats(),
  Total: initialRealmStats(),
});

const capitalizeFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

function getLeaderboardHref(metric: Metric, period: Period, rank: number) {
  const page = Math.floor((rank - 1) / LEADERBOARD_ITEMS_PER_PAGE) + 1;
  return `/leaderboards?metric=${metric}&period=${period}&page=${page}`;
}

function InlineRank({ rank, metric, period }: { rank: number | null; metric: Metric; period: Period }) {
  if (!rank) return null;
  return (
    <Link
      href={getLeaderboardHref(metric, period, rank)}
      className="text-[10px] tabular-nums text-indigo-400 hover:text-indigo-300 transition-colors"
    >
      #{rank.toLocaleString()}
    </Link>
  );
}

const PRIMARY_ROWS: Array<{ label: string; key: keyof RealmStats }> = [
  { label: "Kills", key: "kills" },
  { label: "Death\u00A0Blows", key: "death_blows" },
  { label: "Solo Kills", key: "solo_kills" },
];

const AggregateStatistics: React.FC<{
  characters: CharacterData[];
  leaderboardData: LeaderboardItem[];
  rankClerkUserId: string | null;
}> = ({
  characters,
  leaderboardData,
  rankClerkUserId,
}) => {
  const aggregateStats: AggregateStats = initialAggregateStats();

  characters.forEach((character) => {
    const realm = character.realm;
    const playerKills = character.player_kills?.total || {
      kills: character.heraldTotalKills || 0,
      death_blows: character.heraldTotalDeathBlows || 0,
      solo_kills: character.heraldTotalSoloKills || 0
    };

    const realmPoints = character.heraldRealmPoints || 0;
    const realmPointsLastWeek = character.realmPointsLastWeek || 0;
    const realmPointsThisWeek =
      character.heraldRealmPoints - character.totalRealmPoints;

    if (aggregateStats[realm]) {
      aggregateStats[realm].kills += playerKills.kills;
      aggregateStats[realm].death_blows += playerKills.death_blows;
      aggregateStats[realm].solo_kills += playerKills.solo_kills;
      aggregateStats[realm].realmPoints += realmPoints;
      aggregateStats[realm].realmPointsLastWeek += realmPointsLastWeek;
      aggregateStats[realm].realmPointsThisWeek += realmPointsThisWeek;
    }

    aggregateStats.Total.kills += playerKills.kills;
    aggregateStats.Total.death_blows += playerKills.death_blows;
    aggregateStats.Total.solo_kills += playerKills.solo_kills;
    aggregateStats.Total.realmPoints += realmPoints;
    aggregateStats.Total.realmPointsLastWeek += realmPointsLastWeek;
    aggregateStats.Total.realmPointsThisWeek += realmPointsThisWeek;
  });

  const formatNumber = (num: number | undefined) => {
    if (typeof num !== "number" || isNaN(num)) return "N/A";
    return num.toLocaleString();
  };

  const realmNames = ["Albion", "Midgard", "Hibernia"] as const;

  const totalRanks = React.useMemo(() => {
    const getRank = (metric: Metric, period: Period) => {
      if (!rankClerkUserId || leaderboardData.length === 0) {
        return null;
      }
      const key =
        period === "total"
          ? `total${capitalizeFirst(metric)}`
          : `${metric}${capitalizeFirst(period)}`;
      const sorted = [...leaderboardData].sort((a, b) => {
        const diff = (b[key as keyof LeaderboardItem] as number) - (a[key as keyof LeaderboardItem] as number);
        if (diff !== 0) return diff;
        return a.userId - b.userId;
      });
      const rankIndex = sorted.findIndex((item) => item.clerkUserId === rankClerkUserId);
      return rankIndex >= 0 ? rankIndex + 1 : null;
    };

    return {
      kills: getRank("kills", "total"),
      death_blows: getRank("deathBlows", "total"),
      solo_kills: getRank("soloKills", "total"),
      realmPoints: getRank("realmPoints", "total"),
      realmPointsLastWeek: getRank("realmPoints", "lastWeek"),
      realmPointsThisWeek: getRank("realmPoints", "thisWeek"),
    } as Record<string, number | null>;
  }, [leaderboardData, rankClerkUserId]);

  const hasAnyRank = Object.values(totalRanks).some((r) => r !== null);

  return (
    <div className="bg-gray-900 p-2 sm:p-4 w-full">
      <div className="text-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-medium text-gray-300">
          Aggregate Statistics
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
        {realmNames.map((realm) => (
          <div
            key={realm}
            className="bg-gray-900 border border-gray-800 rounded-md text-white min-w-0"
          >
            <div className={`${getRealmSurfaceClass(realm)} py-1 px-3 sm:px-4 rounded-t-md`}>
              <span className="text-xs font-medium">{realm}</span>
            </div>
            <div className="divide-y divide-gray-800 px-3 sm:px-4 py-1">
              {PRIMARY_ROWS.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1.5 whitespace-nowrap hover:bg-gray-800/40 rounded-sm transition-colors"
                >
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">
                    {formatNumber(aggregateStats[realm][row.key])}
                  </span>
                </div>
              ))}
              <div className="py-1.5 hover:bg-gray-800/40 rounded-sm transition-colors">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs text-gray-400">
                    <span className="sm:hidden">RPs</span>
                    <span className="hidden sm:inline">Realm Points</span>
                  </span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">
                    {formatNumber(aggregateStats[realm].realmPoints)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1 pl-2 sm:pl-3 border-l border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Last Week</span>
                    <span className="text-[11px] font-semibold text-gray-300 ml-auto tabular-nums">
                      {formatNumber(aggregateStats[realm].realmPointsLastWeek)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">This Week</span>
                    <span className="text-[11px] font-semibold text-gray-300 ml-auto tabular-nums">
                      {formatNumber(aggregateStats[realm].realmPointsThisWeek)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 sm:mt-3 flex flex-col lg:flex-row lg:gap-3 w-full">
        <div className="bg-gray-900 border border-gray-800 rounded-md text-white lg:w-72 lg:shrink-0 lg:h-[236px] overflow-hidden">
          <div className={`${getRealmSurfaceClass("Total")} flex items-center py-1 px-3 sm:px-4 rounded-t-md`}>
            <span className="text-xs font-medium">Total</span>
            {hasAnyRank && (
              <span className="ml-auto text-[9px] uppercase tracking-wider text-gray-500">Rank</span>
            )}
          </div>
          <div className="divide-y divide-gray-800 py-1">
            {PRIMARY_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-1.5 px-3 sm:px-4 whitespace-nowrap hover:bg-gray-800/40 rounded-sm transition-colors"
              >
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className="text-xs font-semibold text-white ml-auto tabular-nums">
                  {formatNumber(aggregateStats.Total[row.key])}
                </span>
                {hasAnyRank && (
                  <span className="w-10 text-right shrink-0">
                    <InlineRank
                      rank={totalRanks[row.key]}
                      metric={METRIC_MAP[row.key].metric}
                      period={METRIC_MAP[row.key].period}
                    />
                  </span>
                )}
              </div>
            ))}
            <div className="py-1.5 px-3 sm:px-4 hover:bg-gray-800/40 rounded-sm transition-colors">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-xs text-gray-400">Realm Points</span>
                <span className="text-xs font-semibold text-white ml-auto tabular-nums">
                  {formatNumber(aggregateStats.Total.realmPoints)}
                </span>
                {hasAnyRank && (
                  <span className="w-10 text-right shrink-0">
                    <InlineRank
                      rank={totalRanks.realmPoints}
                      metric="realmPoints"
                      period="total"
                    />
                  </span>
                )}
              </div>
              <div className="mt-1.5 space-y-1 pl-2 sm:pl-3 border-l border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500">Last Week</span>
                  <span className="text-[11px] font-semibold text-gray-300 ml-auto tabular-nums">
                    {formatNumber(aggregateStats.Total.realmPointsLastWeek)}
                  </span>
                  {hasAnyRank && (
                    <span className="w-10 text-right shrink-0">
                      <InlineRank
                        rank={totalRanks.realmPointsLastWeek}
                        metric="realmPoints"
                        period="lastWeek"
                      />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500">This Week</span>
                  <span className="text-[11px] font-semibold text-gray-300 ml-auto tabular-nums">
                    {formatNumber(aggregateStats.Total.realmPointsThisWeek)}
                  </span>
                  {hasAnyRank && (
                    <span className="w-10 text-right shrink-0">
                      <InlineRank
                        rank={totalRanks.realmPointsThisWeek}
                        metric="realmPoints"
                        period="thisWeek"
                      />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:flex-1 lg:min-w-0">
          <RecentActivity characters={characters} />
        </div>
      </div>
    </div>
  );
};

export default AggregateStatistics;
