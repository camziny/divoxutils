"use client";

import React from "react";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
type StatCardOption = "Total" | "Albion" | "Midgard" | "Hibernia";

const LEADERBOARD_ITEMS_PER_PAGE = 15;
const REALM_NAMES = ["Albion", "Hibernia", "Midgard"] as const;

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
      className="text-[10px] leading-none tabular-nums text-indigo-400 hover:text-indigo-300 transition-colors"
    >
      #{rank.toLocaleString()}
    </Link>
  );
}

function formatPercentPart(numerator: number, denominator: number) {
  if (denominator <= 0 || Number.isNaN(numerator) || Number.isNaN(denominator)) {
    return "N/A";
  }
  return `${((numerator / denominator) * 100).toFixed(2)}%`;
}

type CombatPrimaryRow = {
  key: "kills" | "death_blows" | "solo_kills";
  label: string;
  compactLabel?: string;
};

const PRIMARY_ROWS: CombatPrimaryRow[] = [
  { key: "kills", label: "Kills" },
  { key: "death_blows", label: "Death\u00A0Blows", compactLabel: "DBs" },
  { key: "solo_kills", label: "Solo Kills", compactLabel: "SKs" },
];

function CombatStatLabel({ row }: { row: CombatPrimaryRow }) {
  if (row.compactLabel) {
    return (
      <>
        <span className="inline sm:hidden">{row.label}</span>
        <span className="hidden md:inline">{row.label}</span>
        <span className="hidden whitespace-nowrap sm:inline md:hidden">{row.compactLabel}</span>
      </>
    );
  }
  return <span>{row.label}</span>;
}

function RealmPointsStatLabel() {
  return (
    <>
      <span className="inline sm:hidden">Realm Points</span>
      <span className="hidden md:inline">Realm Points</span>
      <span className="hidden whitespace-nowrap sm:inline md:hidden">RPs</span>
    </>
  );
}

const STAT_VALUE_NUM_CLASS =
  "shrink-0 text-right text-xs font-semibold tabular-nums tracking-tight text-white leading-none";

const STAT_CARD_BODY_CLASS = "divide-y divide-gray-800 px-3 sm:px-4 py-1";

const STAT_CARD_ROW_CLASS =
  "flex w-full min-w-0 items-center gap-2 py-1.5 sm:gap-3 hover:bg-gray-800/40 rounded-sm transition-colors";

const STAT_CARD_LABEL_CLASS = "min-w-0 flex-1 text-xs text-gray-400";

const STAT_RP_BLOCK_CLASS = "py-1.5 hover:bg-gray-800/40 rounded-sm transition-colors";

const STAT_RP_NESTED_BLOCK_CLASS = "mt-1.5 space-y-1 pl-2 sm:pl-3 border-l border-gray-800";

const STAT_RP_SUBROW_LABEL_CLASS = "text-[11px] text-gray-500 min-w-0 truncate";

const STAT_RP_SUBROW_VALUE_CLASS =
  "text-[11px] font-semibold text-gray-300 tabular-nums text-right shrink-0 leading-none";

const STAT_COMBAT_VISUAL_VALUES_CLASS =
  "flex shrink-0 items-baseline justify-end gap-x-0.5 tabular-nums leading-none";

const STAT_CARD_HEADER_BAR_CLASS =
  "flex min-h-9 items-center px-3 py-1.5 sm:px-4 rounded-t-md";

const AggregateStatistics: React.FC<{
  characters: CharacterData[];
  leaderboardData: LeaderboardItem[];
  rankClerkUserId: string | null;
}> = ({
  characters,
  leaderboardData,
  rankClerkUserId,
}) => {
  const [selectedStatCard, setSelectedStatCard] = React.useState<StatCardOption>("Total");
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

  const combatPrimaryMetricCell = (rowKey: keyof RealmStats, stats: RealmStats) => {
    const mixPct =
      rowKey === "death_blows"
        ? formatPercentPart(stats.death_blows, stats.kills)
        : rowKey === "solo_kills"
          ? formatPercentPart(stats.solo_kills, stats.kills)
          : null;

    const countStr = formatNumber(stats[rowKey]);
    const screenReaderValue =
      rowKey === "kills"
        ? `${countStr} total kills`
        : rowKey === "death_blows"
          ? mixPct === "N/A"
            ? `${countStr}. Share of kills unavailable.`
            : `${countStr}. ${mixPct} of kills are death blows.`
          : mixPct === "N/A"
            ? `${countStr}. Share of kills unavailable.`
            : `${countStr}. ${mixPct} of kills are solo kills.`;

    return (
      <>
        <span className="sr-only">{screenReaderValue}</span>
        <div className={STAT_COMBAT_VISUAL_VALUES_CLASS} aria-hidden="true">
          {mixPct ? (
            <>
              <span className="select-none whitespace-nowrap pr-[1px] text-right text-[11px] font-medium tabular-nums tracking-tighter text-gray-500">
                {mixPct}
              </span>
              <span className="mx-px h-3 w-px shrink-0 self-center bg-white/[0.08]" />
            </>
          ) : null}
          <span className={STAT_VALUE_NUM_CLASS}>{countStr}</span>
        </div>
      </>
    );
  };

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

  const renderRealmCard = (realm: (typeof REALM_NAMES)[number]) => (
    <div
      key={realm}
      className="bg-gray-900 border border-gray-800 rounded-md text-white min-w-0"
    >
      <div className={`${getRealmSurfaceClass(realm)} ${STAT_CARD_HEADER_BAR_CLASS}`}>
        <span className="text-xs font-medium leading-none">{realm}</span>
      </div>
      <div className={STAT_CARD_BODY_CLASS}>
        {PRIMARY_ROWS.map((row, i) => (
          <div key={i} className={STAT_CARD_ROW_CLASS}>
            <span className={STAT_CARD_LABEL_CLASS}>
              <CombatStatLabel row={row} />
            </span>
            <div className="shrink-0">{combatPrimaryMetricCell(row.key, aggregateStats[realm])}</div>
          </div>
        ))}
        <div className={STAT_RP_BLOCK_CLASS}>
          <div className="flex w-full min-w-0 items-center gap-2">
            <span className={STAT_CARD_LABEL_CLASS}>
              <RealmPointsStatLabel />
            </span>
            <div className="shrink-0">
              <span className={STAT_VALUE_NUM_CLASS}>
                {formatNumber(aggregateStats[realm].realmPoints)}
              </span>
            </div>
          </div>
          <div className={STAT_RP_NESTED_BLOCK_CLASS}>
            <div className="flex items-center gap-2">
              <span className={STAT_RP_SUBROW_LABEL_CLASS}>Last Week</span>
              <span className={`${STAT_RP_SUBROW_VALUE_CLASS} ml-auto`}>
                {formatNumber(aggregateStats[realm].realmPointsLastWeek)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={STAT_RP_SUBROW_LABEL_CLASS}>This Week</span>
              <span className={`${STAT_RP_SUBROW_VALUE_CLASS} ml-auto`}>
                {formatNumber(aggregateStats[realm].realmPointsThisWeek)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTotalCard = (className = "") => (
    <div className={`bg-gray-900 border border-gray-800 rounded-md text-white overflow-hidden ${className}`}>
      <div
        className={`${getRealmSurfaceClass("Total")} ${STAT_CARD_HEADER_BAR_CLASS} w-full justify-between gap-2`}
      >
        <span className="text-xs font-medium leading-none">Total</span>
        {hasAnyRank ? (
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-gray-500 tabular-nums leading-none">
            Rank
          </span>
        ) : null}
      </div>
      <div className={STAT_CARD_BODY_CLASS}>
        {PRIMARY_ROWS.map((row, i) => (
          <div key={i} className={STAT_CARD_ROW_CLASS}>
            <span className={STAT_CARD_LABEL_CLASS}>
              <CombatStatLabel row={row} />
            </span>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="min-w-0 shrink-0">{combatPrimaryMetricCell(row.key, aggregateStats.Total)}</div>
              {hasAnyRank && (
                <span className="flex w-10 shrink-0 justify-end">
                  <InlineRank
                    rank={totalRanks[row.key]}
                    metric={METRIC_MAP[row.key].metric}
                    period={METRIC_MAP[row.key].period}
                  />
                </span>
              )}
            </div>
          </div>
        ))}
        <div className={STAT_RP_BLOCK_CLASS}>
          <div className="flex w-full min-w-0 items-center gap-2">
            <span className={STAT_CARD_LABEL_CLASS}>
              <RealmPointsStatLabel />
            </span>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="shrink-0">
                <span className={STAT_VALUE_NUM_CLASS}>{formatNumber(aggregateStats.Total.realmPoints)}</span>
              </div>
              {hasAnyRank && (
                <span className="flex w-10 shrink-0 justify-end">
                  <InlineRank
                    rank={totalRanks.realmPoints}
                    metric="realmPoints"
                    period="total"
                  />
                </span>
              )}
            </div>
          </div>
          <div className={STAT_RP_NESTED_BLOCK_CLASS}>
            <div className="flex items-center gap-2">
              <span className={STAT_RP_SUBROW_LABEL_CLASS}>Last Week</span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                <span className={STAT_RP_SUBROW_VALUE_CLASS}>
                  {formatNumber(aggregateStats.Total.realmPointsLastWeek)}
                </span>
                {hasAnyRank && (
                  <span className="flex w-10 shrink-0 justify-end">
                    <InlineRank
                      rank={totalRanks.realmPointsLastWeek}
                      metric="realmPoints"
                      period="lastWeek"
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={STAT_RP_SUBROW_LABEL_CLASS}>This Week</span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                <span className={STAT_RP_SUBROW_VALUE_CLASS}>
                  {formatNumber(aggregateStats.Total.realmPointsThisWeek)}
                </span>
                {hasAnyRank && (
                  <span className="flex w-10 shrink-0 justify-end">
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
    </div>
  );

  return (
    <div className="bg-gray-900 p-2 sm:p-4 w-full">
      <div className="text-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-medium text-gray-300">
          Aggregate Statistics
        </h2>
      </div>

      <div className="sm:hidden">
        <ToggleGroup
          value={selectedStatCard}
          onValueChange={(value) => {
            if (value) setSelectedStatCard(value as StatCardOption);
          }}
          className="mb-2 grid w-full grid-cols-4"
        >
          {(["Total", ...REALM_NAMES] as const).map((option) => (
            <ToggleGroupItem key={option} value={option} className="w-full px-1">
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {selectedStatCard === "Total"
          ? renderTotalCard()
          : renderRealmCard(selectedStatCard)}
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-2 sm:gap-3 w-full">
        {REALM_NAMES.map((realm) => (
          renderRealmCard(realm)
        ))}
      </div>

      <div className="mt-2 sm:mt-3 flex flex-col lg:flex-row lg:gap-3 w-full">
        {renderTotalCard(
          "hidden sm:block lg:shrink-0 lg:flex-[0_0_calc((100%-1.5rem)/3)] lg:min-w-0 lg:max-w-[calc((100%-1.5rem)/3)]"
        )}

        <div className="lg:flex-1 lg:min-w-0">
          <RecentActivity characters={characters} />
        </div>
      </div>
    </div>
  );
};

export default AggregateStatistics;
