"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import { Pagination } from "@/components/ui/pagination";
import { CheckCircle2, User } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  { key: "losses", label: "Losses" },
  { key: "games", label: "Fights" },
];

function parseClassLeaderboardSort(value: string | null): SortKey {
  if (value === "wins" || value === "losses" || value === "games" || value === "winRate") {
    return value;
  }
  return "winRate";
}

function parseClassLeaderboardPage(value: string | null): number {
  if (!value) return 1;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

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
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/draft-history/class-leaderboard";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const sortFromUrl = parseClassLeaderboardSort(searchParams?.get("sort") ?? null);
  const pageFromUrl = parseClassLeaderboardPage(searchParams?.get("page") ?? null);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [sortBy, setSortBy] = useState<SortKey>(sortFromUrl);
  const [animate, setAnimate] = useState(false);
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
    setSortBy(sortFromUrl);
  }, [sortFromUrl]);

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
    setAnimate(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, [className]);

  useEffect(() => {
    requestAnimationFrame(() => setAnimate(true));
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);
    if (className === classOptions[0]) {
      nextParams.delete("class");
    } else {
      nextParams.set("class", className);
    }
    if (sortBy === "winRate") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", sortBy);
    }
    if (currentPage <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(currentPage));
    }
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${safePathname}?${nextQuery}` : safePathname;
    const currentUrl = searchParamsString ? `${safePathname}?${searchParamsString}` : safePathname;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    className,
    classOptions,
    currentPage,
    router,
    safePathname,
    searchParamsString,
    sortBy,
  ]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-100">
            Class Leaderboard
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Verified drafts only
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleGroup value={sortBy} onValueChange={(val) => {
            if (!val) return;
            setAnimate(false);
            setSortBy(val as SortKey);
            setCurrentPage(1);
            requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
          }}>
            {SORT_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.key} value={opt.key}>
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={className}
            onValueChange={(value) => {
              const nextParams = new URLSearchParams(searchParamsString);
              if (value === classOptions[0]) {
                nextParams.delete("class");
              } else {
                nextParams.set("class", value);
              }
              nextParams.delete("page");
              const nextQuery = nextParams.toString();
              router.push(
                nextQuery
                  ? `${safePathname}?${nextQuery}`
                  : safePathname
              );
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[220px] border-gray-800 bg-gray-900 text-xs text-gray-200">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)]">
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
                  href={getLeaderboardProfileHref(row.clerkUserId, row.userName)}
                  className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/20"
                >
                  <span className="w-6 text-right text-xs tabular-nums text-gray-600 font-medium">
                    {rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <AvatarChip name={row.userName} avatarUrl={row.avatarUrl} />
                        <span className="truncate text-sm font-medium text-gray-200 group-hover:text-white">
                          {row.userName}
                        </span>
                        {row.isVerified ? <VerifiedCheck /> : null}
                      </span>
                      <span className="inline-flex flex-col items-end tabular-nums leading-tight">
                        <span className="text-sm text-gray-200">
                          {row.winRate.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {row.wins}-{row.losses}
                        </span>
                      </span>
                    </div>
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
