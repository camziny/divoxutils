"use client";

import { useEffect, useState } from "react";

const UPDATE_HOURS_ET = [0, 4, 8, 12, 16, 20] as const;
const RUN_WINDOW_MINUTES = 20;

type EventScheduleBannerProps = {
  lastCompletedAt: Date | null;
};

function getETParts(now: Date): { weekday: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekdayText = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { weekday: weekdayMap[weekdayText] ?? 0, hour, minute };
}

function formatHour(hour: number): string {
  const displayHour = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${displayHour}:00 ${ampm} ET`;
}

function formatCompletedAt(date: Date | null): string {
  if (!date) return "No completed run yet";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date) + " ET";
}

type RunDiff = {
  hour: number;
  diffMin: number;
};

function getScheduleDiffs(now: Date): { last: RunDiff; next: RunDiff } {
  const et = getETParts(now);
  const currentMinutes = et.hour * 60 + et.minute;
  let last: RunDiff | null = null;
  let next: RunDiff | null = null;

  for (let dayOffset = -7; dayOffset <= 7; dayOffset += 1) {
    const weekday = (et.weekday + dayOffset + 700) % 7;
    for (const hour of UPDATE_HOURS_ET) {
      if (weekday === 1 && hour === 0) {
        continue;
      }

      const diffMin = dayOffset * 24 * 60 + hour * 60 - currentMinutes;
      if (diffMin <= 0 && (!last || diffMin > last.diffMin)) {
        last = { hour, diffMin };
      }
      if (diffMin > 0 && (!next || diffMin < next.diffMin)) {
        next = { hour, diffMin };
      }
    }
  }

  return {
    last: last ?? { hour: 20, diffMin: -4 * 60 },
    next: next ?? { hour: 4, diffMin: 4 * 60 },
  };
}

function formatRelative(diffMin: number): string {
  const total = Math.abs(diffMin);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function EventScheduleBanner({ lastCompletedAt }: EventScheduleBannerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { last, next } = getScheduleDiffs(now);
  const sinceLastScheduled = Math.abs(last.diffMin);
  const isRunningWindow = sinceLastScheduled <= RUN_WINDOW_MINUTES;
  const statusLabel = isRunningWindow ? "Updating now" : "Idle";
  const statusTone = isRunningWindow ? "text-amber-300" : "text-emerald-300";

  return (
    <div className="mt-3 rounded-md border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-[12px] text-gray-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-gray-300 font-medium">Lillith Event</span>
          <span className="hidden sm:inline">- updates every 4h</span>
        </div>
        <span className={`${statusTone} font-medium`}>{statusLabel}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
        <span>
          Last completed <span className="text-gray-300">{formatCompletedAt(lastCompletedAt)}</span>
        </span>
        <span>
          Next scheduled <span className="text-gray-300">{formatHour(next.hour)}</span>{" "}
          <span className="text-gray-600">({formatRelative(next.diffMin)})</span>
        </span>
      </div>
      <div className="mt-1 text-[11px] text-gray-600">
        Runs start on schedule and usually finish within a few minutes.
      </div>
    </div>
  );
}
