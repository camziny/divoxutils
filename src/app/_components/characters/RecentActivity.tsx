"use client";

import React, { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const hasStoredBaseline =
    (character.totalRealmPoints ?? 0) > 0 ||
    (character.totalKills ?? 0) > 0 ||
    (character.totalDeathBlows ?? 0) > 0 ||
    (character.totalSoloKills ?? 0) > 0 ||
    (character.totalDeaths ?? 0) > 0;
  const hasHeraldHistory =
    (character.heraldRealmPoints ?? 0) > 0 ||
    (character.heraldTotalKills ?? 0) > 0 ||
    (character.heraldTotalDeathBlows ?? 0) > 0 ||
    (character.heraldTotalSoloKills ?? 0) > 0 ||
    (character.heraldTotalDeaths ?? 0) > 0;

  if (!hasStoredBaseline && hasHeraldHistory) {
    return { rp: 0, kills: 0, deathBlows: 0, soloKills: 0, deaths: 0 };
  }

  const rp = Math.max(0, (character.heraldRealmPoints ?? 0) - (character.totalRealmPoints ?? 0));
  const kills =
    character.heraldTotalKills != null
      ? Math.max(0, character.heraldTotalKills - (character.totalKills ?? 0))
      : null;
  const deathBlows =
    character.heraldTotalDeathBlows != null
      ? Math.max(0, character.heraldTotalDeathBlows - (character.totalDeathBlows ?? 0))
      : null;
  const soloKills =
    character.heraldTotalSoloKills != null
      ? Math.max(0, character.heraldTotalSoloKills - (character.totalSoloKills ?? 0))
      : 0;
  const deaths =
    character.heraldTotalDeaths != null
      ? Math.max(0, character.heraldTotalDeaths - (character.totalDeaths ?? 0))
      : 0;
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
    <div className="mt-2 sm:mt-3">
      <div className="bg-gray-900 border border-gray-800 rounded-md text-white">
        <div className="bg-gray-800/10 flex items-center py-1 px-3 sm:px-4 rounded-t-md">
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
          <div className="divide-y divide-gray-800 py-1">
            <div className="flex items-center gap-3 py-1 px-3 sm:px-4">
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

            {activeRows.map((row) => (
              <div
                key={row.id}
                className={`flex items-center gap-3 py-1.5 px-3 sm:px-4 rounded-sm transition-colors ${getRealmSurfaceInteractiveClass(row.realm)}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-200 truncate block">{row.name}</span>
                  <span className="text-[10px] text-gray-500 block">{row.className}</span>
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
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
