"use client";

import { useEffect, useState } from "react";

const UPDATE_HOURS_ET = [0, 4, 8, 12, 16, 20] as const;
const RUN_WINDOW_MINUTES = 45;

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
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return { weekday: weekdayMap[weekdayText] ?? 0, hour, minute };
}

function formatHour(hour: number): string {
  const displayHour = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${displayHour}:00 ${ampm} ET`;
}

function formatCompletedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date) + " ET";
}

function getMostRecentScheduledTime(now: Date): Date {
  const et = getETParts(now);
  const currentMinutes = et.hour * 60 + et.minute;

  for (let dayOffset = 0; dayOffset >= -7; dayOffset--) {
    const weekday = (et.weekday + dayOffset + 700) % 7;
    const hours = [...UPDATE_HOURS_ET].reverse();
    for (const hour of hours) {
      if (weekday === 1 && hour === 0) continue;
      const diffMin = dayOffset * 24 * 60 + hour * 60 - currentMinutes;
      if (diffMin <= 0) {
        const result = new Date(now);
        result.setMinutes(result.getMinutes() + diffMin);
        return result;
      }
    }
  }

  return new Date(0);
}

function getNextScheduledHour(now: Date): number {
  const et = getETParts(now);
  const currentMinutes = et.hour * 60 + et.minute;

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const weekday = (et.weekday + dayOffset) % 7;
    for (const hour of UPDATE_HOURS_ET) {
      if (weekday === 1 && hour === 0) continue;
      const diffMin = dayOffset * 24 * 60 + hour * 60 - currentMinutes;
      if (diffMin > 0) return hour;
    }
  }

  return 4;
}

export default function EventScheduleBanner({ lastCompletedAt }: EventScheduleBannerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const nextHour = getNextScheduledHour(now);
  const mostRecentScheduled = getMostRecentScheduledTime(now);
  const minutesSinceMostRecentScheduled = Math.max(
    0,
    Math.floor((now.getTime() - mostRecentScheduled.getTime()) / 60000)
  );
  const isUpdating =
    minutesSinceMostRecentScheduled <= RUN_WINDOW_MINUTES &&
    (!lastCompletedAt || lastCompletedAt < mostRecentScheduled);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-[12px] text-gray-500">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-gray-300 font-medium">Lillith Event</span>
        <span className="hidden sm:inline">- updates every 4h</span>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        {lastCompletedAt && (
          <span>Last completed {formatCompletedAt(lastCompletedAt)}</span>
        )}
        <span>
          Next <span className="text-gray-400">{formatHour(nextHour)}</span>
        </span>
      </div>
      {isUpdating && (
        <span className="w-full text-[11px] text-gray-500">
          Update in progress, may take a few minutes to complete.
        </span>
      )}
    </div>
  );
}
