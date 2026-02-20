"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "history", label: "History", href: "/draft-history" },
  { key: "leaderboard", label: "Leaderboard", href: "/draft-history/leaderboard" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function DraftHistoryNav({ active }: { active: Tab }) {
  return (
    <nav className="mb-8 flex items-center gap-1 border-b border-gray-800 pb-px">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors duration-100 border-b-2 -mb-px",
            tab.key === active
              ? "text-gray-100 border-gray-100"
              : "text-gray-500 border-transparent hover:text-gray-300"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
