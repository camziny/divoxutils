"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ChevronRight, Trophy, User } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import DiscordIdentityLinkCard from "./DiscordIdentityLinkCard";
import type { DraftLogRow } from "@/server/draftStats";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";

const ITEMS_PER_PAGE = 12;

export function getNormalizedFightIndex(
  fightsLength: number,
  selectedIndex?: number
): number {
  if (fightsLength <= 0) return 0;
  if (typeof selectedIndex !== "number" || Number.isNaN(selectedIndex)) return 0;
  return Math.min(Math.max(selectedIndex, 0), fightsLength - 1);
}

export function getDiscordServerFilterOptions(rows: DraftLogRow[]) {
  const byGuild = new Map<string, string>();
  for (const row of rows) {
    if (!row.discordGuildId) continue;
    const displayName = row.discordGuildName?.trim() || row.discordGuildId;
    if (!byGuild.has(row.discordGuildId)) {
      byGuild.set(row.discordGuildId, displayName);
    }
  }
  return Array.from(byGuild.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterDraftRowsByDiscordServer(
  rows: DraftLogRow[],
  selectedGuildId: string
) {
  return selectedGuildId === "all"
    ? rows
    : rows.filter((row) => row.discordGuildId === selectedGuildId);
}

export function getDraftHistoryBanSections(
  bans: DraftLogRow["bans"]
): {
  team1: DraftLogRow["bans"];
  team2: DraftLogRow["bans"];
  auto: DraftLogRow["bans"];
} {
  const team1 = bans.filter((ban) => ban.team === 1 && ban.source !== "auto");
  const team2 = bans.filter((ban) => ban.team === 2 && ban.source !== "auto");
  const auto = bans.filter((ban) => ban.source === "auto");
  return { team1, team2, auto };
}

export function formatAutoBanSummary(classNames: string[], maxVisible = 3) {
  if (classNames.length === 0) return null;
  const visible = classNames.slice(0, maxVisible);
  const remaining = classNames.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")} +${remaining}` : visible.join(", ");
}

export function parseDraftHistoryPage(pageParam: string | null): number {
  if (!pageParam) return 1;
  const parsed = Number(pageParam);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

export function getDraftHistoryUrl(
  pathname: string,
  searchParamsString: string,
  selectedGuildId: string,
  page: number
) {
  const nextParams = new URLSearchParams(searchParamsString);
  if (selectedGuildId === "all") {
    nextParams.delete("server");
  } else {
    nextParams.set("server", selectedGuildId);
  }
  if (page <= 1) {
    nextParams.delete("page");
  } else {
    nextParams.set("page", String(page));
  }
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getDraftHistoryFilterUrl(
  pathname: string,
  searchParamsString: string,
  selectedGuildId: string
) {
  return getDraftHistoryUrl(pathname, searchParamsString, selectedGuildId, 1);
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DraftHistoryClient({
  initialRows,
}: {
  initialRows: DraftLogRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/draft-history";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const pageFromUrl = parseDraftHistoryPage(searchParams?.get("page") ?? null);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [expandedShortIds, setExpandedShortIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedFightByShortId, setSelectedFightByShortId] = useState<
    Record<string, number>
  >({});

  const guildOptions = useMemo(
    () => getDiscordServerFilterOptions(initialRows),
    [initialRows]
  );
  const validGuildIds = useMemo(
    () => new Set(guildOptions.map((guild) => guild.id)),
    [guildOptions]
  );
  const selectedGuildIdFromUrl = searchParams?.get("server") ?? "all";
  const selectedGuildId =
    selectedGuildIdFromUrl === "all" || validGuildIds.has(selectedGuildIdFromUrl)
      ? selectedGuildIdFromUrl
      : "all";

  const filteredRows = useMemo(
    () => filterDraftRowsByDiscordServer(initialRows, selectedGuildId),
    [initialRows, selectedGuildId]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredRows.length / ITEMS_PER_PAGE),
    [filteredRows.length]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const avatarByDiscordUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of initialRows) {
      for (const player of row.players ?? []) {
        if (player.discordUserId && player.avatarUrl) {
          map.set(player.discordUserId, player.avatarUrl);
        }
      }
    }
    return map;
  }, [initialRows]);

  useEffect(() => {
    setCurrentPage(pageFromUrl);
  }, [pageFromUrl]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const nextUrl = getDraftHistoryUrl(
      safePathname,
      searchParamsString,
      selectedGuildId,
      currentPage
    );
    const currentUrl = searchParamsString
      ? `${safePathname}?${searchParamsString}`
      : safePathname;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [currentPage, router, safePathname, searchParamsString, selectedGuildId]);

  const toggle = (id: string, row: DraftLogRow) => {
    const fights = row.fights ?? [];
    setExpandedShortIds((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSelectedFightByShortId((prev) => {
      if (prev[id] !== undefined) return prev;
      return {
        ...prev,
        [id]: 0,
      };
    });
  };

  const teamPlayers = (row: DraftLogRow, team: 1 | 2) =>
    row.players
      .filter((p) => p.team === team)
      .sort((a, b) => (a.isCaptain === b.isCaptain ? 0 : a.isCaptain ? -1 : 1));

  return (
    <>
      <div className="mb-6">
        <DiscordIdentityLinkCard />
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-100">
          Draft History
        </h1>
        <p className="mt-1 text-[13px] text-gray-500">
          {filteredRows.length > 0
            ? `${filteredRows.length} completed draft${filteredRows.length !== 1 ? "s" : ""}`
            : "All completed drafts"}
        </p>
      </div>

      <div className="mb-4 flex w-full flex-col items-start gap-1.5">
        <label className="text-xs text-gray-500">
          Discord server
        </label>
        <Select
          value={selectedGuildId}
          onValueChange={(value) => {
            const nextUrl = getDraftHistoryFilterUrl(
              safePathname,
              searchParamsString,
              value
            );
            router.replace(nextUrl, { scroll: false });
            setCurrentPage(1);
            setExpandedShortIds(new Set());
            setSelectedFightByShortId({});
          }}
        >
          <SelectTrigger className="h-8 w-full text-xs border-gray-700 bg-gray-800/60 whitespace-nowrap [&>span]:truncate [&>span]:whitespace-nowrap">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {guildOptions.map((guild) => (
              <SelectItem key={guild.id} value={guild.id}>
                {guild.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No completed drafts for this guild.
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {paginatedRows.map((row) => {
              const cap1 = row.players.find(
                (p) => p.team === 1 && p.isCaptain
              );
              const cap2 = row.players.find(
                (p) => p.team === 2 && p.isCaptain
              );
              const isExpanded = expandedShortIds.has(row.shortId);
              const winnerName =
                row.winnerTeam === 1
                  ? cap1?.displayName
                  : row.winnerTeam === 2
                    ? cap2?.displayName
                    : null;
              const fights = row.fights ?? [];
              const { team1: team1Bans, team2: team2Bans, auto: autoBans } =
                getDraftHistoryBanSections(row.bans ?? []);
              const selectedFightIndex = getNormalizedFightIndex(
                fights.length,
                selectedFightByShortId[row.shortId] ?? 0
              );
              const selectedFight = fights[selectedFightIndex];
              const selectedFightClassesByDiscordUserId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (entry.discordUserId) acc[entry.discordUserId] = entry.className;
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightClassesByPlayerId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (entry.playerId) acc[String(entry.playerId)] = entry.className;
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightOccupantNameByPlayerId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (entry.playerId && entry.substituteDisplayName) {
                      acc[String(entry.playerId)] = entry.substituteDisplayName;
                    }
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightOccupantNameByDiscordUserId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    const effectiveDiscordUserId =
                      entry.substituteMode === "known" && entry.substituteDiscordUserId
                        ? entry.substituteDiscordUserId
                        : entry.discordUserId;
                    if (effectiveDiscordUserId && entry.substituteDisplayName) {
                      acc[effectiveDiscordUserId] = entry.substituteDisplayName;
                    }
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightSubstituteByPlayerId =
                (selectedFight?.classesByPlayer ?? []).reduce<
                  Record<string, { displayName: string; avatarUrl?: string }>
                >((acc, entry) => {
                  if (!entry.playerId || !entry.substituteDisplayName) return acc;
                  const substituteDiscordUserId =
                    entry.substituteMode === "known" && entry.substituteDiscordUserId
                      ? entry.substituteDiscordUserId
                      : undefined;
                  const substituteAvatarUrl =
                    entry.substituteAvatarUrl ??
                    (substituteDiscordUserId
                      ? avatarByDiscordUserId.get(substituteDiscordUserId)
                      : undefined);
                  acc[String(entry.playerId)] = {
                    displayName: entry.substituteDisplayName,
                    avatarUrl: substituteAvatarUrl,
                  };
                  return acc;
                }, {}) ?? {};
              const selectedFightSubstituteByDiscordUserId =
                (selectedFight?.classesByPlayer ?? []).reduce<
                  Record<string, { displayName: string; avatarUrl?: string }>
                >((acc, entry) => {
                  const substituteDiscordUserId =
                    entry.substituteMode === "known" && entry.substituteDiscordUserId
                      ? entry.substituteDiscordUserId
                      : undefined;
                  if (!substituteDiscordUserId || !entry.substituteDisplayName) return acc;
                  acc[substituteDiscordUserId] = {
                    displayName: entry.substituteDisplayName,
                    avatarUrl:
                      entry.substituteAvatarUrl ??
                      avatarByDiscordUserId.get(substituteDiscordUserId),
                  };
                  return acc;
                }, {}) ?? {};
              const selectedFightOccupantClerkUserIdByPlayerId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (entry.playerId && entry.substituteClerkUserId) {
                      acc[String(entry.playerId)] = entry.substituteClerkUserId;
                    } else if (entry.playerId && entry.clerkUserId) {
                      acc[String(entry.playerId)] = entry.clerkUserId;
                    }
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightOccupantClerkUserIdByDiscordUserId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (entry.substituteDiscordUserId && entry.substituteClerkUserId) {
                      acc[entry.substituteDiscordUserId] = entry.substituteClerkUserId;
                    } else if (entry.discordUserId && entry.clerkUserId) {
                      acc[entry.discordUserId] = entry.clerkUserId;
                    }
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightOccupantDiscordUserIdByPlayerId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (!entry.playerId) return acc;
                    acc[String(entry.playerId)] =
                      entry.substituteMode === "known" && entry.substituteDiscordUserId
                        ? entry.substituteDiscordUserId
                        : entry.discordUserId;
                    return acc;
                  },
                  {}
                ) ?? {};
              const selectedFightOccupantDiscordUserIdByDiscordUserId =
                (selectedFight?.classesByPlayer ?? []).reduce<Record<string, string>>(
                  (acc, entry) => {
                    if (!entry.discordUserId) return acc;
                    acc[entry.discordUserId] =
                      entry.substituteMode === "known" && entry.substituteDiscordUserId
                        ? entry.substituteDiscordUserId
                        : entry.discordUserId;
                    return acc;
                  },
                  {}
                ) ?? {};

              return (
                <div
                  key={row.shortId}
                  className="rounded-lg border border-gray-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(row.shortId, row)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/20 transition-colors duration-100 group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform duration-150 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 truncate flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <InlineAvatar
                                name={cap1?.displayName ?? "Team 1"}
                                avatarUrl={cap1?.avatarUrl}
                                size={18}
                              />
                              <span className="font-medium truncate">
                                {cap1?.displayName ?? "Team 1"}
                              </span>
                            </span>
                            <span className="text-gray-600 mx-1.5">vs</span>
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <InlineAvatar
                                name={cap2?.displayName ?? "Team 2"}
                                avatarUrl={cap2?.avatarUrl}
                                size={18}
                              />
                              <span className="font-medium truncate">
                                {cap2?.displayName ?? "Team 2"}
                              </span>
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                        {winnerName ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-100">
                            <Trophy className="w-3 h-3 text-indigo-300" />
                            <span>{winnerName}</span>
                            {row.setScore ? <span className="text-indigo-200/90">{row.setScore}</span> : null}
                          </span>
                        ) : (
                          <span className="text-gray-600">No result</span>
                        )}
                        <span className="text-gray-600 hidden sm:inline">
                          {formatDate(row.createdAtMs)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-800/60 px-4 py-4 bg-gray-950/40">
                      {fights.length > 1 ? (
                        <div className="mb-3 flex justify-start">
                          <div className="inline-flex items-center gap-1 rounded border border-gray-800/80 bg-gray-900/40 p-1">
                            {fights.map((fight, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  setSelectedFightByShortId((prev) => ({
                                    ...prev,
                                    [row.shortId]: i,
                                  }))
                                }
                                className={
                                  i === selectedFightIndex
                                    ? "rounded px-3 py-1 text-[11px] font-medium text-gray-200 bg-gray-800"
                                    : "rounded px-3 py-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors duration-100"
                                }
                              >
                                Fight {fight.fightNumber ?? i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TeamPanel
                          label={row.team1Realm ?? "Team 1"}
                          players={teamPlayers(row, 1)}
                          isWinner={
                            fights.length > 0
                              ? selectedFight?.winnerTeam === 1
                              : row.winnerTeam === 1
                          }
                          bans={team1Bans}
                          classByDiscordUserId={selectedFightClassesByDiscordUserId}
                          classByPlayerId={selectedFightClassesByPlayerId}
                          occupantNameByPlayerId={selectedFightOccupantNameByPlayerId}
                          occupantNameByDiscordUserId={
                            selectedFightOccupantNameByDiscordUserId
                          }
                          occupantClerkUserIdByPlayerId={
                            selectedFightOccupantClerkUserIdByPlayerId
                          }
                          occupantClerkUserIdByDiscordUserId={
                            selectedFightOccupantClerkUserIdByDiscordUserId
                          }
                          occupantDiscordUserIdByPlayerId={
                            selectedFightOccupantDiscordUserIdByPlayerId
                          }
                          occupantDiscordUserIdByDiscordUserId={
                            selectedFightOccupantDiscordUserIdByDiscordUserId
                          }
                          substituteByPlayerId={selectedFightSubstituteByPlayerId}
                          substituteByDiscordUserId={selectedFightSubstituteByDiscordUserId}
                        />
                        <TeamPanel
                          label={row.team2Realm ?? "Team 2"}
                          players={teamPlayers(row, 2)}
                          isWinner={
                            fights.length > 0
                              ? selectedFight?.winnerTeam === 2
                              : row.winnerTeam === 2
                          }
                          bans={team2Bans}
                          classByDiscordUserId={selectedFightClassesByDiscordUserId}
                          classByPlayerId={selectedFightClassesByPlayerId}
                          occupantNameByPlayerId={selectedFightOccupantNameByPlayerId}
                          occupantNameByDiscordUserId={
                            selectedFightOccupantNameByDiscordUserId
                          }
                          occupantClerkUserIdByPlayerId={
                            selectedFightOccupantClerkUserIdByPlayerId
                          }
                          occupantClerkUserIdByDiscordUserId={
                            selectedFightOccupantClerkUserIdByDiscordUserId
                          }
                          occupantDiscordUserIdByPlayerId={
                            selectedFightOccupantDiscordUserIdByPlayerId
                          }
                          occupantDiscordUserIdByDiscordUserId={
                            selectedFightOccupantDiscordUserIdByDiscordUserId
                          }
                          substituteByPlayerId={selectedFightSubstituteByPlayerId}
                          substituteByDiscordUserId={selectedFightSubstituteByDiscordUserId}
                        />
                      </div>
                      {autoBans.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-800/40">
                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                            Auto-banned
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {autoBans.map((ban) => (
                              <span
                                key={ban.className}
                                className="inline-flex items-center rounded bg-gray-800/60 border border-gray-700/50 px-2 py-0.5 text-[11px] text-gray-400"
                              >
                                {ban.className}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-gray-800/40 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]">
                        {row.type === "pvp" ? (
                          <span className="inline-flex items-center rounded bg-indigo-500/10 border border-indigo-400/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                            PvP
                          </span>
                        ) : row.team1Realm && row.team2Realm ? (
                          <span className="text-gray-400">
                            {row.team1Realm} vs {row.team2Realm}
                          </span>
                        ) : null}
                        <span className="text-gray-700 select-none">&middot;</span>
                        <span className="text-gray-400">
                          {row.teamSize}v{row.teamSize}
                        </span>
                        <span className="text-gray-700 select-none">&middot;</span>
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-gray-500">
                          <User className="w-3 h-3 flex-shrink-0 text-gray-600" />
                          <span className="truncate max-w-[100px] sm:max-w-[180px]">
                            {row.createdByDisplayName || row.createdBy}
                          </span>
                        </span>
                        {row.discordGuildName && (
                          <>
                            <span className="text-gray-700 select-none">&middot;</span>
                            <span className="inline-flex min-w-0 items-center gap-1.5 text-gray-400">
                              <FaDiscord className="w-3 h-3 flex-shrink-0 text-indigo-400" />
                              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                                {row.discordGuildName}
                              </span>
                            </span>
                          </>
                        )}
                        <span className="ml-auto flex-shrink-0">
                          {row.resultStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : row.resultStatus === "voided" ? (
                            <span className="text-[10px] font-medium text-red-400/70">
                              Voided
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-gray-600">
                              Unverified
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-8 flex justify-center">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </>
  );
}

function TeamPanel({
  label,
  players,
  isWinner,
  bans,
  classByDiscordUserId,
  classByPlayerId,
  occupantNameByPlayerId,
  occupantNameByDiscordUserId,
  occupantClerkUserIdByPlayerId,
  occupantClerkUserIdByDiscordUserId,
  occupantDiscordUserIdByPlayerId,
  occupantDiscordUserIdByDiscordUserId,
  substituteByPlayerId,
  substituteByDiscordUserId,
}: {
  label: string;
  players: Array<{
    _id?: string;
    discordUserId: string;
    clerkUserId?: string;
    displayName: string;
    avatarUrl?: string;
    isCaptain: boolean;
  }>;
  isWinner: boolean;
  bans: Array<{ className: string }>;
  classByDiscordUserId: Record<string, string>;
  classByPlayerId: Record<string, string>;
  occupantNameByPlayerId: Record<string, string>;
  occupantNameByDiscordUserId: Record<string, string>;
  occupantClerkUserIdByPlayerId: Record<string, string>;
  occupantClerkUserIdByDiscordUserId: Record<string, string>;
  occupantDiscordUserIdByPlayerId: Record<string, string>;
  occupantDiscordUserIdByDiscordUserId: Record<string, string>;
  substituteByPlayerId: Record<string, { displayName: string; avatarUrl?: string }>;
  substituteByDiscordUserId: Record<string, { displayName: string; avatarUrl?: string }>;
}) {
  return (
    <div
      className={
        isWinner
          ? "rounded-lg border border-indigo-400/20 bg-indigo-500/5 ring-1 ring-indigo-400/20 p-3"
          : "rounded-lg border border-gray-800/40 p-3"
      }
    >
      <div className="mb-2 flex min-h-[20px] items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {isWinner && (
          <Badge variant="winner" className="text-[9px]">
            Winner
          </Badge>
        )}
        {!isWinner && (
          <Badge
            variant="winner"
            className="pointer-events-none text-[9px] opacity-0"
          >
            Winner
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        {players.length === 0 ? (
          <p className="text-sm text-gray-600">No players</p>
        ) : (
          players.map((p) => {
            const substitute =
              substituteByPlayerId[p._id ?? ""] ??
              substituteByDiscordUserId[p.discordUserId];
            const resolvedName =
              occupantNameByPlayerId[p._id ?? ""] ??
              occupantNameByDiscordUserId[p.discordUserId] ??
              p.displayName;
            const resolvedAvatarUrl = substitute ? substitute.avatarUrl : p.avatarUrl;
            const substituteClerkUserId =
              occupantClerkUserIdByPlayerId[p._id ?? ""] ??
              occupantClerkUserIdByDiscordUserId[p.discordUserId];
            const resolvedClerkUserId = substitute
              ? substituteClerkUserId
              : substituteClerkUserId ?? p.clerkUserId;
            const resolvedDiscordUserId =
              occupantDiscordUserIdByPlayerId[p._id ?? ""] ??
              occupantDiscordUserIdByDiscordUserId[p.discordUserId] ??
              p.discordUserId;
            const resolvedProfileUserId =
              resolvedClerkUserId ?? `discord:${resolvedDiscordUserId}`;
            const showCaptainBadge = p.isCaptain && !substitute;
            return (
              <div
                key={`${p.discordUserId}-${p._id ?? "no-id"}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm text-gray-300"
              >
                <InlineAvatar
                  name={resolvedName}
                  avatarUrl={resolvedAvatarUrl}
                  size={18}
                />
                <Link
                  href={getLeaderboardProfileHref(
                    resolvedProfileUserId,
                    resolvedName
                  )}
                  className="truncate hover:text-white transition-colors duration-100"
                >
                  {resolvedName}
                  {showCaptainBadge ? (
                    <span className="ml-1 text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                      C
                    </span>
                  ) : null}
                </Link>
                <span className="text-[10px] text-gray-600">
                  {classByPlayerId[p._id ?? ""] ??
                    classByDiscordUserId[p.discordUserId] ??
                    "—"}
                </span>
              </div>
            );
          })
        )}
      </div>
      {bans.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800/40">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
            Banned
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bans.map((b, i) => (
              <span
                key={i}
                className="rounded bg-gray-800/60 px-1.5 py-0.5 text-xs text-gray-400"
              >
                {b.className}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl?: string;
  size: number;
}) {
  const style = { width: size, height: size };
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className="rounded-full bg-gray-800/80 text-gray-400 inline-flex items-center justify-center"
      style={style}
    >
      <User className="w-[65%] h-[65%]" />
    </span>
  );
}
