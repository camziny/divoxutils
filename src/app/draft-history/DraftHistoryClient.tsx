"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Trophy, User } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import DiscordIdentityLinkCard from "./DiscordIdentityLinkCard";
import type { DraftLogRow } from "@/server/draftStats";

const ITEMS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedShortIds, setExpandedShortIds] = useState<Set<string>>(
    new Set()
  );

  const totalPages = useMemo(
    () => Math.ceil(initialRows.length / ITEMS_PER_PAGE),
    [initialRows.length]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return initialRows.slice(start, start + ITEMS_PER_PAGE);
  }, [initialRows, currentPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggle = (id: string) =>
    setExpandedShortIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
          {initialRows.length > 0
            ? `${initialRows.length} completed draft${initialRows.length !== 1 ? "s" : ""}`
            : "All completed drafts"}
        </p>
      </div>

      {initialRows.length === 0 ? (
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No completed drafts yet.
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

              return (
                <div
                  key={row.shortId}
                  className="rounded-lg border border-gray-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(row.shortId)}
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
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-200">
                            <Trophy className="w-3 h-3 text-indigo-400" />
                            {winnerName}
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
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TeamPanel
                          label={row.team1Realm ?? "Team 1"}
                          players={teamPlayers(row, 1)}
                          isWinner={row.winnerTeam === 1}
                          bans={row.bans.filter((b) => b.team === 1)}
                        />
                        <TeamPanel
                          label={row.team2Realm ?? "Team 2"}
                          players={teamPlayers(row, 2)}
                          isWinner={row.winnerTeam === 2}
                          bans={row.bans.filter((b) => b.team === 2)}
                        />
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.type === "pvp" ? (
                            <span className="inline-flex items-center rounded bg-indigo-500/10 border border-indigo-400/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                              PvP
                            </span>
                          ) : row.team1Realm && row.team2Realm ? (
                            <span className="text-gray-400">
                              {row.team1Realm} vs {row.team2Realm}
                            </span>
                          ) : null}

                          {row.discordGuildName && (
                            <span className="text-gray-700 select-none">
                              &middot;
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-gray-400">
                              <FaDiscord className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                              {row.discordGuildName}
                            </span>
                          )}

                          <span className="text-gray-700 select-none">
                            &middot;
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <User className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {row.createdByDisplayName || row.createdBy}
                          </span>
                        </div>

                        {row.resultStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 flex-shrink-0 ml-3">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : row.resultStatus === "voided" ? (
                          <span className="text-[10px] font-medium text-red-400/70 flex-shrink-0 ml-3">
                            Voided
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-600 flex-shrink-0 ml-3">
                            Unverified
                          </span>
                        )}
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
}: {
  label: string;
  players: Array<{
    discordUserId: string;
    displayName: string;
    avatarUrl?: string;
    isCaptain: boolean;
  }>;
  isWinner: boolean;
  bans: Array<{ className: string }>;
}) {
  return (
    <div
      className={
        isWinner
          ? "rounded-lg border border-indigo-400/20 bg-indigo-500/5 ring-1 ring-indigo-400/20 p-3"
          : "rounded-lg border border-gray-800/40 p-3"
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {isWinner && (
          <Badge variant="winner" className="text-[9px]">
            Winner
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        {players.length === 0 ? (
          <p className="text-sm text-gray-600">No players</p>
        ) : (
          players.map((p) => (
            <div
              key={p.discordUserId}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <InlineAvatar name={p.displayName} avatarUrl={p.avatarUrl} size={18} />
              <span>{p.displayName}</span>
              {p.isCaptain && (
                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                  C
                </span>
              )}
            </div>
          ))
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
