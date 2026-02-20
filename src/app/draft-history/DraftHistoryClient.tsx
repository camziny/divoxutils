"use client";

import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { ChevronRight, Trophy } from "lucide-react";
import DraftHistoryNav from "./DraftHistoryNav";
import DiscordIdentityLinkCard from "./DiscordIdentityLinkCard";

type DraftLogRow = {
  shortId: string;
  discordGuildId: string;
  winnerTeam?: 1 | 2;
  resultStatus: "unverified" | "verified" | "voided";
  createdAtMs: number;
  players: Array<{
    discordUserId: string;
    displayName: string;
    team?: 1 | 2;
    isCaptain: boolean;
  }>;
  bans: Array<{
    team: 1 | 2;
    className: string;
  }>;
};

const ITEMS_PER_PAGE = 12;

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DraftHistoryClient() {
  const [rows, setRows] = useState<DraftLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedShortIds, setExpandedShortIds] = useState<Set<string>>(
    new Set()
  );

  const totalPages = useMemo(
    () => Math.ceil(rows.length / ITEMS_PER_PAGE),
    [rows.length]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(start, start + ITEMS_PER_PAGE);
  }, [rows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/draft-stats/drafts", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Request failed.");
        setRows(data.rows);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load draft log.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
    <section className="max-w-3xl mx-auto px-6">
      <DraftHistoryNav active="history" />
      <DiscordIdentityLinkCard />

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-100">
          Draft History
        </h1>
        <p className="mt-1 text-[13px] text-gray-500">
          {rows.length > 0
            ? `${rows.length} completed draft${rows.length !== 1 ? "s" : ""}`
            : "All completed drafts"}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-gray-800 px-4 py-6 text-sm text-red-400">
          {error}
        </div>
      ) : isLoading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
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
                          <p className="text-sm text-gray-200 truncate">
                            <span className="font-medium">
                              {cap1?.displayName ?? "Team 1"}
                            </span>
                            <span className="text-gray-600 mx-1.5">vs</span>
                            <span className="font-medium">
                              {cap2?.displayName ?? "Team 2"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                        {winnerName ? (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Trophy className="w-3 h-3 text-gray-400" />
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
                          label="Team 1"
                          players={teamPlayers(row, 1)}
                          isWinner={row.winnerTeam === 1}
                          bans={row.bans.filter((b) => b.team === 1)}
                        />
                        <TeamPanel
                          label="Team 2"
                          players={teamPlayers(row, 2)}
                          isWinner={row.winnerTeam === 2}
                          bans={row.bans.filter((b) => b.team === 2)}
                        />
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center gap-3 text-[11px] text-gray-600">
                        <span>{formatDate(row.createdAtMs)}</span>
                        <span className="w-px h-3 bg-gray-800" />
                        <span>{row.discordGuildId}</span>
                        <span className="w-px h-3 bg-gray-800" />
                        <span className="capitalize">{row.resultStatus}</span>
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
    </section>
  );
}

function TeamPanel({
  label,
  players,
  isWinner,
  bans,
}: {
  label: string;
  players: Array<{ displayName: string; isCaptain: boolean }>;
  isWinner: boolean;
  bans: Array<{ className: string }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {isWinner && (
          <Trophy className="w-3 h-3 text-gray-400" />
        )}
      </div>
      <div className="space-y-1">
        {players.length === 0 ? (
          <p className="text-sm text-gray-600">No players</p>
        ) : (
          players.map((p) => (
            <div
              key={p.displayName}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
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

function Skeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-800 px-4 py-3.5 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 rounded bg-gray-800" />
            <div className="h-3 w-24 rounded bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
