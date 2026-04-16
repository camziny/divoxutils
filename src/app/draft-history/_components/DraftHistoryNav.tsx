"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "history", label: "History", href: "/draft-history" },
  { key: "leaderboard", label: "Leaderboard", href: "/draft-history/leaderboard" },
  {
    key: "classRankings",
    label: "Class Rankings",
    href: "/draft-history/class-leaderboard",
  },
  { key: "live", label: "Live", href: "/draft-history/live" },
] as const;

export default function DraftHistoryNav({
  liveDraftCount = 0,
}: {
  liveDraftCount?: number;
}) {
  const pathname = usePathname() ?? "";
  const hasLiveDrafts = liveDraftCount > 0;

  return (
    <nav className="mb-8 flex items-center gap-1 border-b border-gray-800 pb-px">
      {TABS.map((tab) => {
        const isActive =
          tab.key === "history"
            ? pathname === "/draft-history"
            : tab.key === "live"
              ? pathname.startsWith("/draft-history/live")
            : tab.key === "leaderboard"
              ? pathname.startsWith("/draft-history/leaderboard")
              : pathname.startsWith("/draft-history/class-leaderboard");

        const isLiveTab = tab.key === "live";

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors duration-100 border-b-2 -mb-px",
              isActive
                ? "text-gray-100 border-gray-100"
                : "text-gray-500 border-transparent hover:text-gray-300",
              isLiveTab && hasLiveDrafts && !isActive && "text-indigo-400 hover:text-indigo-300"
            )}
          >
            {tab.label}
            {isLiveTab && hasLiveDrafts && (
              <span className="ml-1.5 relative inline-flex h-2 w-2 -top-px">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
