"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FaDiscord } from "react-icons/fa";

const TABS = [
  { key: "history", label: "History" },
  { key: "leaderboard", label: "Leaderboard" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function DraftTestPage() {
  const [active, setActive] = useState<Tab>("history");

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <section className="max-w-3xl mx-auto px-6">
        <nav className="mb-8 flex items-center gap-1 border-b border-gray-800 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors duration-100 border-b-2 -mb-px",
                tab.key === active
                  ? "text-gray-100 border-gray-100"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 px-4 py-3 mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
              <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-gray-100">
              Track your draft history
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Sign in and link your Discord account to see your stats on the leaderboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {active === "history" && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-gray-100">
                Draft History
              </h1>
              <p className="mt-1 text-[13px] text-gray-500">
                All completed drafts
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 px-4 py-10 text-center">
              <p className="text-sm text-gray-500">
                Nothing to show yet. Completed drafts will appear here.
              </p>
            </div>
          </>
        )}

        {active === "leaderboard" && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-gray-100">
                Leaderboard
              </h1>
              <p className="mt-1 text-[13px] text-gray-500">
                Verified drafts only
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 px-4 py-10 text-center">
              <p className="text-sm text-gray-500">
                No verified records yet. Stats will populate as drafts are completed and verified.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
