import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Swords } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import {
  HiMagnifyingGlass,
  HiTrophy,
  HiChartBar,
  HiStar,
  HiEye,
  HiInformationCircle,
} from "react-icons/hi2";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "DAoC tools",
  description:
    "Browse divoxutils, a web application for the Dark Age of Camelot community: character tracking, user and character search, leaderboards, realm ranks, live drafts, a full Discord bot, and maintained Ghost UI.",
  path: "/tools",
  openGraphTitle: "Dark Age of Camelot tools on divoxutils",
});

const TOOLS = [
  {
    href: "/search",
    name: "Player search",
    summary: "Find players and characters.",
    icon: <HiMagnifyingGlass className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/leaderboards",
    name: "Leaderboards",
    summary: "Rankings and progression.",
    icon: <HiTrophy className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/realm-ranks",
    name: "Realm rank chart",
    summary: "Realm rank thresholds and realm point reference table.",
    icon: <HiChartBar className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/draft-history",
    name: "Draft history",
    summary: "Past and live draft events, results, and stats.",
    icon: <Swords className="h-5 w-5 text-indigo-400" strokeWidth={2} />,
  },
  {
    href: "/draft-history/leaderboard",
    name: "Draft leaderboard",
    summary: "Overall draft performance compared across community players.",
    icon: <HiStar className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/discord",
    name: "Discord bot",
    summary: "Slash commands for character lookups, comparisons, and live drafts.",
    icon: <FaDiscord className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/ui",
    name: "Ghost UI",
    summary: "In-game user interface download for Dark Age of Camelot on Windows.",
    icon: <HiEye className="h-5 w-5 text-indigo-400" />,
  },
  {
    href: "/about",
    name: "About",
    summary: "The story behind divoxutils and community links.",
    icon: <HiInformationCircle className="h-5 w-5 text-indigo-400" />,
  },
];

export default function ToolsPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-12">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tools
          </h1>
        </header>

        <section aria-labelledby="tools-list-heading">
          <h2 id="tools-list-heading" className="sr-only">
            Tool list
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-800/30 px-5 py-4 transition-all hover:border-indigo-500/40 hover:bg-gray-800/60"
              >
                <span className="mt-0.5 shrink-0 rounded-lg bg-gray-700/50 p-2 transition-colors group-hover:bg-indigo-500/10">
                  {tool.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {tool.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
