"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { CheckCircle2, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DraftClassLeaderboardRow } from "@/server/draftStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 20;
type SortKey = "wins" | "winRate" | "games" | "losses";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "winRate", label: "Win %" },
  { key: "wins", label: "Wins" },
  { key: "games", label: "Fights" },
  { key: "losses", label: "Losses" },
];

function sortRows(rows: DraftClassLeaderboardRow[], key: SortKey): DraftClassLeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const diff = b[key] - a[key];
    if (diff !== 0) return diff;
    if (key !== "wins" && b.wins !== a.wins) return b.wins - a.wins;
    return b.games - a.games;
  });
}

export default function ClassLeaderboardClient({
  className,
  classOptions,
  rows,
}: {
  className: string;
  classOptions: string[];
  rows: DraftClassLeaderboardRow[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("winRate");
  const router = useRouter();
  const sortedRows = useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);

  const totalPages = useMemo(
    () => Math.ceil(sortedRows.length / ITEMS_PER_PAGE),
    [sortedRows.length]
  );
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRows.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSortBy("winRate");
  }, [className]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-100">
            Class Leaderboard
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Fight record by class across verified drafts
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-gray-600 uppercase tracking-wider mr-1">
              Sort
            </span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setSortBy(opt.key);
                  setCurrentPage(1);
                }}
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
          <Select
            value={className}
            onValueChange={(value) =>
              router.push(
                `/draft-history/class-leaderboard?class=${encodeURIComponent(value)}`
              )
            }
          >
            <SelectTrigger className="h-8 w-full sm:w-[220px] border-gray-800 bg-gray-900 text-xs text-gray-200">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {classOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedRows.length === 0 ? (
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No verified records yet for {className}.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
            {paginatedRows.map((row, index) => {
              const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <Link
                  key={`${row.className}-${row.clerkUserId}`}
                  href={`/draft-history/leaderboard/${row.clerkUserId}`}
                  className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/20"
                >
                  <span className="w-6 text-right text-xs tabular-nums text-gray-600 font-medium">
                    {rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <AvatarChip name={row.userName} />
                        <span className="truncate text-sm font-medium text-gray-200 group-hover:text-white">
                          {row.userName}
                        </span>
                        {row.isVerified ? <VerifiedCheck /> : null}
                      </span>
                      <span className="text-sm text-gray-200 tabular-nums">
                        {row.wins}-{row.losses}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400/60"
                        style={{
                          width: `${Math.min(100, Math.max(0, row.winRate))}%`,
                        }}
                      />
                    </div>
                  </div>
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

function AvatarChip({ name }: { name: string }) {
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
