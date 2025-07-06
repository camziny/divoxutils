import React from "react";
import LeaderboardListSkeleton from "../components/LeaderboardListSkeleton";
import LeaderboardTooltip from "../components/LeaderboardTooltip";

export default function LeaderboardsLoading() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto text-center">
          <div className="mb-6">
            <LeaderboardTooltip />
          </div>
          <LeaderboardListSkeleton />
        </div>
      </div>
    </div>
  );
} 