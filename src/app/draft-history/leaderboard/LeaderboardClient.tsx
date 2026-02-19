"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { ChevronRight } from "lucide-react";
import DraftHistoryNav from "../DraftHistoryNav";

type OverallRow = {
  clerkUserId: string;
  userName: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
  captainWins: number;
  captainLosses: number;
  captainGames: number;
  captainWinRate: number;
};

type SortKey = "wins" | "winRate" | "games" | "losses";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "winRate", label: "Win %" },
  { key: "wins", label: "Wins" },
  { key: "games", label: "Drafts" },
  { key: "losses", label: "Losses" },
];

const ITEMS_PER_PAGE = 20;

function sortRows(rows: OverallRow[], key: SortKey): OverallRow[] {
  return [...rows].sort((a, b) => {
    const diff = b[key] - a[key];
    if (diff !== 0) return diff;
    if (key !== "wins" && b.wins !== a.wins) return b.wins - a.wins;
    return b.games - a.games;
  });
}

export default function LeaderboardClient() {
  const [rows, setRows] = useState<OverallRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("winRate");
  const [animate, setAnimate] = useState(false);

  const sorted = useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);

  const totalPages = useMemo(
    () => Math.ceil(sorted.length / ITEMS_PER_PAGE),
    [sorted.length]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);



  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/draft-stats/overall", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Request failed.");
        setRows(data.rows);
        requestAnimationFrame(() => setAnimate(true));
      } catch (err: any) {
        setError(err?.message ?? "Unable to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSort = (key: SortKey) => {
    setAnimate(false);
    setSortBy(key);
    setCurrentPage(1);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  };

  return (
    <section className="max-w-3xl mx-auto px-6">
      <DraftHistoryNav active="leaderboard" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-100">
            Leaderboard
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Verified drafts only
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-600 uppercase tracking-wider mr-1">
            Sort
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-100 ${
                sortBy === opt.key
                  ? "bg-gray-800 text-gray-200"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-gray-800 px-4 py-6 text-sm text-red-400">
          {error}
        </div>
      ) : isLoading ? (
        <Skeleton />
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No verified records yet.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
            {paginatedRows.map((row, index) => {
              const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <Link
                  key={row.clerkUserId}
                  href={`/draft-history/leaderboard/${row.clerkUserId}`}
                  className="group flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-gray-800/20 transition-colors duration-100"
                >
                  <span className="w-6 text-right text-xs tabular-nums text-gray-600 font-medium flex-shrink-0">
                    {rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Name + record on one line */}
                    <div className={`flex items-baseline justify-between gap-3${sortBy === "winRate" ? " mb-1.5" : ""}`}>
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate transition-colors duration-100">
                        {row.userName}
                      </span>
                      <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                        {row.wins}W {row.losses}L · {row.winRate.toFixed(1)}%
                      </span>
                    </div>
                    {/* Win rate bar — only visible when sorting by Win % */}
                    {sortBy === "winRate" && (
                      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/80 transition-all duration-700 ease-out"
                          style={{
                            width: animate
                              ? `${Math.min(100, Math.max(0, row.winRate))}%`
                              : "0%",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 transition-colors duration-100 flex-shrink-0" />
                </Link>
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

function Skeleton() {
  return (
    <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-6 h-4 rounded bg-gray-800" />
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <div className="h-4 rounded bg-gray-800 w-28" />
                <div className="h-3 rounded bg-gray-800 w-20" />
              </div>
              <div className="h-1 rounded-full bg-gray-800" />
            </div>
            <div className="w-3.5 h-3.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
