"use client";

import { useState } from "react";
import type { LeaderboardChampionClass } from "@/server/leaderboard";
import {
  getClassChampionTooltip,
  normalizeChampionClassName,
} from "@/utils/championClassName";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type LeaderboardChampionBadgeProps = {
  championClasses: LeaderboardChampionClass[];
};

const MAX_VISIBLE_CROWNS = 4;

function tooltipFor(champion: LeaderboardChampionClass): string {
  return getClassChampionTooltip(
    normalizeChampionClassName(champion.className),
    champion.realm
  );
}

function CrownIcon() {
  return (
    <svg
      className="w-[11px] h-[10px] sm:w-[13px] sm:h-[12px]"
      viewBox="0 0 576 512"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"
        fill="#818CF8"
      />
    </svg>
  );
}

export default function LeaderboardChampionBadge({
  championClasses = [],
}: LeaderboardChampionBadgeProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!championClasses.length) {
    return null;
  }

  const visibleClasses = championClasses.slice(0, MAX_VISIBLE_CROWNS);
  const overflowClasses = championClasses.slice(MAX_VISIBLE_CROWNS);

  const activeTooltipLines =
    activeIndex < visibleClasses.length
      ? [tooltipFor(visibleClasses[activeIndex])]
      : overflowClasses.map(tooltipFor);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onMouseLeave={() => setActiveIndex(0)}
        >
          {visibleClasses.map((champion, index) => (
            <span
              key={`${champion.className}-${champion.realm}`}
              className="inline-flex items-center justify-center w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-md hover:bg-indigo-500/10 transition-colors duration-150 cursor-default"
              aria-label={tooltipFor(champion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <CrownIcon />
            </span>
          ))}
          {overflowClasses.length > 0 && (
            <span
              className="inline-flex items-center justify-center h-[18px] sm:h-[22px] text-[9px] sm:text-[10px] font-bold leading-none text-gray-400 bg-white/5 rounded-md px-1 sm:px-1.5 ml-0.5 cursor-default"
              aria-label={`${overflowClasses.length} more class titles`}
              onMouseEnter={() => setActiveIndex(visibleClasses.length)}
            >
              +{overflowClasses.length}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        {activeTooltipLines.length === 1 ? (
          activeTooltipLines[0]
        ) : (
          <div className="flex flex-col gap-0.5">
            {activeTooltipLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
