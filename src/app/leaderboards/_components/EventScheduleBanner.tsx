"use client";

const UPDATE_HOURS_ET = [0, 4, 8, 12, 16, 20] as const;

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

export default function EventScheduleBanner() {
  const now = new Date();
  const { last, next } = getScheduleDiffs(now);

  return (
    <div className="mt-3 flex items-center justify-between gap-4 rounded-md border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-[12px] text-gray-500">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-gray-300 font-medium">Lillith Event</span>
        <span className="hidden sm:inline">- updates every 4h</span>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span>Updated {formatRelative(last.diffMin)} ago</span>
        <span>
          Next <span className="text-gray-400">{formatHour(next.hour)}</span>{" "}
          <span className="text-gray-600">({formatRelative(next.diffMin)})</span>
        </span>
      </div>
    </div>
  );
}
