import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlayerDrilldownLoading() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/draft-history/leaderboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors duration-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Leaderboard
        </Link>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-gray-800 animate-pulse" />
        <div className="h-4 w-28 rounded bg-gray-800 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2 mt-6">
          <div className="rounded-lg border border-gray-800 h-32 animate-pulse" />
          <div className="rounded-lg border border-gray-800 h-32 animate-pulse" />
        </div>
      </div>
    </>
  );
}
