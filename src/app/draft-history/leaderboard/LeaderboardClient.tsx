"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "@/components/ui/pagination";
import { CheckCircle2, ChevronRight, User } from "lucide-react";
import type { DraftLeaderboardRow } from "@/server/draftLeaderboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortKey = "wins" | "winRate" | "games" | "losses";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "winRate", label: "Win %" },
  { key: "wins", label: "Wins" },
  { key: "games", label: "Drafts" },
  { key: "losses", label: "Losses" },
];

const ITEMS_PER_PAGE = 20;

function sortRows(rows: DraftLeaderboardRow[], key: SortKey): DraftLeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const diff = b[key] - a[key];
    if (diff !== 0) return diff;
    if (key !== "wins" && b.wins !== a.wins) return b.wins - a.wins;
    return b.games - a.games;
  });
}

export default function LeaderboardClient({
  initialRows,
}: {
  initialRows: DraftLeaderboardRow[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("winRate");
  const [animate, setAnimate] = useState(false);

  const sorted = useMemo(() => sortRows(initialRows, sortBy), [initialRows, sortBy]);

  const totalPages = useMemo(
    () => Math.ceil(sorted.length / ITEMS_PER_PAGE),
    [sorted.length]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    requestAnimationFrame(() => setAnimate(true));
  }, []);

  const handleSort = (key: SortKey) => {
    setAnimate(false);
    setSortBy(key);
    setCurrentPage(1);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  };

  return (
    <>
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

      {sorted.length === 0 ? (
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
                  key={row.id}
                  href={`/draft-history/leaderboard/${row.id}`}
                  className="group flex items-center gap-3 sm:gap-4 px-4 py-2.5 hover:bg-gray-800/20 transition-colors duration-100"
                >
                  <span className="w-6 text-right text-xs tabular-nums text-gray-600 font-medium flex-shrink-0">
                    {rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center justify-between gap-3${sortBy === "winRate" ? " mb-1.5" : ""}`}>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <AvatarChip name={row.userName} avatarUrl={row.avatarUrl} />
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate transition-colors duration-100">
                          {row.userName}
                        </span>
                        {row.isVerified ? <VerifiedCheck /> : null}
                      </span>
                      <div className="flex flex-col items-end flex-shrink-0 tabular-nums">
                        <span className="text-sm font-semibold text-gray-200">
                          {sortBy === "winRate"
                            ? `${row.winRate.toFixed(1)}%`
                            : sortBy === "wins"
                              ? `${row.wins}W`
                              : sortBy === "losses"
                                ? `${row.losses}L`
                                : row.games}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {sortBy === "winRate"
                            ? `${row.wins}W ${row.losses}L`
                            : sortBy === "wins"
                              ? `${row.winRate.toFixed(1)}%`
                              : sortBy === "losses"
                                ? `${row.winRate.toFixed(1)}%`
                                : `${row.wins}W ${row.losses}L`}
                        </span>
                      </div>
                    </div>
                    {sortBy === "winRate" && (
                      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-400/60 transition-all duration-700 ease-out"
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
    </>
  );
}

function AvatarChip({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-gray-400">
      <User className="h-3 w-3" />
    </span>
  );
}

function VerifiedCheck() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center flex-shrink-0 cursor-default">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span>Verified</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
