"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import { Pagination } from "@/components/ui/pagination";
import { CheckCircle2, ChevronRight, User, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DraftLeaderboardRow } from "@/server/draftLeaderboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

function formatWinRate(rate: number): string {
  return rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(1);
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-100">
            Leaderboard
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Verified drafts only
            <span className={`inline-block transition-all duration-300 ease-out ${sortBy === "winRate" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 pointer-events-none"}`}>
              <span className="text-gray-700 mx-1.5">·</span>
              <WinRateExplainerDialog />
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleGroup value={sortBy} onValueChange={(val) => { if (val) handleSort(val as SortKey); }}>
            {SORT_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.key} value={opt.key}>
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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
              const showPlacementTooltip = sortBy === "winRate" && row.games < 5;
              const linkContent = (
                <Link
                  key={row.id}
                  href={getLeaderboardProfileHref(row.id, row.userName)}
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
                        <span className={`text-sm font-semibold ${showPlacementTooltip ? "text-gray-400" : "text-gray-200"}`}>
                          {sortBy === "winRate"
                            ? `${formatWinRate(row.winRate)}%`
                            : sortBy === "wins"
                              ? `${row.wins}W`
                              : sortBy === "losses"
                                ? `${row.losses}L`
                                : row.games}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {sortBy === "winRate"
                            ? showPlacementTooltip
                              ? <><span className="text-indigo-400/70 bg-indigo-400/10 rounded px-1.5 py-px mr-1.5">min 5 drafts for full win %</span>{row.wins}W {row.losses}L</>
                              : `${row.wins}W ${row.losses}L`
                            : sortBy === "wins"
                              ? `${formatWinRate(row.winRate)}%`
                              : sortBy === "losses"
                                ? `${formatWinRate(row.winRate)}%`
                                : `${row.wins}W ${row.losses}L`}
                        </span>
                      </div>
                    </div>
                    {sortBy === "winRate" && (
                      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${row.games < 5 ? "bg-indigo-400/25" : "bg-indigo-400/60"}`}
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

              if (showPlacementTooltip) {
                return (
                  <TooltipProvider key={row.id} delayDuration={400}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Under 5 drafts played — win rate counted as {row.wins} out of 5
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return linkContent;
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

function WinRateExplainerDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-indigo-400/80 hover:text-indigo-400 transition-colors shrink-0"
        >
          Learn more
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogClose className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors">
          <X className="h-4 w-4" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle>How Win Rate % Works</DialogTitle>
          <DialogDescription>
            Players need at least 5 drafts for a full win rate.
            Until then, wins are divided by 5 instead of total games.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 space-y-3 text-sm text-gray-300">
          <p className="text-[13px] text-gray-400">
            Win Rate = Wins / (Total Games or 5, whichever is higher)
          </p>
          <div className="rounded-md bg-gray-800/50 px-3 py-2.5 space-y-1.5 text-xs tabular-nums">
            <p className="text-gray-400 text-[11px] mb-1">Under 5 drafts</p>
            <div className="flex justify-between">
              <span className="text-gray-400">2-0 record</span>
              <span>2 / 5 = 40%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">4-1 record</span>
              <span>4 / 5 = 80%</span>
            </div>
          </div>
          <div className="rounded-md bg-gray-800/50 px-3 py-2.5 space-y-1.5 text-xs tabular-nums">
            <p className="text-gray-400 text-[11px] mb-1">5+ drafts (normal)</p>
            <div className="flex justify-between">
              <span className="text-gray-400">7-3 record</span>
              <span>7 / 10 = 70%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">12-8 record</span>
              <span>12 / 20 = 60%</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

