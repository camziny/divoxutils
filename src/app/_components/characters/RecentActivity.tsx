"use client";

import React, { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CharacterData } from "@/utils/character";
import { getRealmSurfaceInteractiveClass } from "./characterTileTheme";

type RecentActivityProps = {
  characters: CharacterData[];
};

type ActivityPeriod = "thisWeek" | "lastWeek";

type ActivityRow = {
  id: number;
  name: string;
  realm: string;
  className: string;
  rp: number;
  kills: number | null;
  deathBlows: number | null;
  soloKills: number;
  deaths: number;
};

function fmt(value: number) {
  return value.toLocaleString();
}

function deriveThisWeek(character: CharacterData): Omit<ActivityRow, "id" | "name" | "realm" | "className"> {
  const deriveDelta = (
    heraldValue: number | null | undefined,
    storedValue: number | null | undefined,
    lastWeekValue: number | null | undefined
  ): number | null => {
    if (heraldValue == null) return null;
    const herald = heraldValue ?? 0;
    const stored = storedValue ?? 0;
    const lastWeek = lastWeekValue ?? 0;
    const hasMetricBaseline = stored > 0 || lastWeek > 0 || herald === 0;
    if (!hasMetricBaseline) return 0;
    return Math.max(0, herald - stored);
  };

  const rp = deriveDelta(
    character.heraldRealmPoints,
    character.totalRealmPoints,
    character.realmPointsLastWeek
  ) ?? 0;
  const kills = deriveDelta(
    character.heraldTotalKills,
    character.totalKills,
    character.killsLastWeek
  );
  const deathBlows = deriveDelta(
    character.heraldTotalDeathBlows,
    character.totalDeathBlows,
    character.deathBlowsLastWeek
  );
  const soloKills = deriveDelta(
    character.heraldTotalSoloKills,
    character.totalSoloKills,
    character.soloKillsLastWeek
  ) ?? 0;
  const deaths = deriveDelta(
    character.heraldTotalDeaths,
    character.totalDeaths,
    character.deathsLastWeek
  ) ?? 0;
  return { rp, kills, deathBlows, soloKills, deaths };
}

function deriveLastWeek(character: CharacterData): Omit<ActivityRow, "id" | "name" | "realm" | "className"> {
  return {
    rp: Math.max(0, character.realmPointsLastWeek ?? 0),
    kills: Math.max(0, character.killsLastWeek ?? 0),
    deathBlows: Math.max(0, character.deathBlowsLastWeek ?? 0),
    soloKills: Math.max(0, character.soloKillsLastWeek ?? 0),
    deaths: Math.max(0, character.deathsLastWeek ?? 0),
  };
}

const STAT_LABELS = [
  { key: "rp" as const, label: "RPs" },
  { key: "kills" as const, label: "Kills" },
  { key: "deathBlows" as const, label: "DBs" },
  { key: "soloKills" as const, label: "SKs" },
  { key: "deaths" as const, label: "Deaths" },
];

const RecentActivity: React.FC<RecentActivityProps> = ({ characters }) => {
  const [period, setPeriod] = useState<ActivityPeriod>("thisWeek");

  const rows = useMemo<ActivityRow[]>(() => {
    return characters.map((character) => {
      const stats = period === "thisWeek" ? deriveThisWeek(character) : deriveLastWeek(character);
      return {
        id: character.id,
        name: character.heraldName || character.characterName || "Unknown",
        realm: character.realm,
        className: character.heraldClassName || character.className || "",
        ...stats,
      };
    });
  }, [characters, period]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diff = b.rp - a.rp;
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [rows]);

  const activeRows = sortedRows.filter(
    (row) =>
      row.rp > 0 ||
      (row.kills ?? 0) > 0 ||
      (row.deathBlows ?? 0) > 0 ||
      row.soloKills > 0 ||
      row.deaths > 0
  );

  return (
    <div className="mt-2 sm:mt-3 lg:mt-0">
      <div className="bg-gray-900 border border-gray-800 rounded-md text-white flex flex-col max-h-[360px] lg:h-[236px] lg:max-h-[236px] overflow-hidden">
        <div className="bg-gray-800/10 flex items-center py-1 px-3 sm:px-4 rounded-t-md shrink-0">
          <span className="text-xs font-medium">Recent Activity</span>
          <div className="ml-auto">
            <ToggleGroup
              value={period}
              onValueChange={(value) => {
                if (value) setPeriod(value as ActivityPeriod);
              }}
            >
              <ToggleGroupItem value="thisWeek">This Week</ToggleGroupItem>
              <ToggleGroupItem value="lastWeek">Last Week</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {activeRows.length === 0 ? (
          <div className="px-3 sm:px-4 py-6 text-center text-xs text-gray-500">
            No activity {period === "thisWeek" ? "this week" : "last week"}.
          </div>
        ) : (
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 py-0.5 px-3 sm:px-4 border-b border-gray-800 shrink-0">
              <span className="text-[10px] text-gray-500 tracking-wider flex-1 min-w-0">Character</span>
              {STAT_LABELS.map((col) => (
                <span
                  key={col.key}
                  className="text-[10px] text-gray-500 tracking-wider w-10 sm:w-14 text-right shrink-0 whitespace-nowrap"
                >
                  {col.label}
                </span>
              ))}
            </div>

            <div className="divide-y divide-gray-800 py-0.5 overflow-y-auto min-h-0">
              {activeRows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-2 py-1 px-3 sm:px-4 rounded-sm transition-colors ${getRealmSurfaceInteractiveClass(row.realm)}`}
                >
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-gray-200 truncate block">{row.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-[10px] text-gray-500 truncate block">{row.className}</span>
                  </div>
                  {STAT_LABELS.map((col) => {
                    const value = row[col.key];
                    return (
                      <span
                        key={col.key}
                        className={`w-10 sm:w-14 text-right tabular-nums whitespace-nowrap shrink-0 ${
                          col.key === "rp"
                            ? "text-xs font-semibold text-white"
                            : "text-xs text-gray-400"
                        }`}
                      >
                        {value === null ? (
                          <span className="text-gray-600">-</span>
                        ) : (
                          fmt(value)
                        )}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
