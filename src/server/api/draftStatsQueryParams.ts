import type { DraftStatsFilters } from "@/server/draftStats";

export function parseNumber(
  value: string | undefined,
  fieldName: string
): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
}

export function parseInteger(
  value: string | undefined,
  fieldName: string
): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return parsed;
}

export function parseDraftStatsFiltersFromSearchParams(
  searchParams: URLSearchParams
): DraftStatsFilters {
  const guildId = searchParams.get("guildId") ?? undefined;
  const startTimeMs = parseNumber(searchParams.get("startTimeMs") ?? undefined, "startTimeMs");
  const endTimeMs = parseNumber(searchParams.get("endTimeMs") ?? undefined, "endTimeMs");
  const minGames = parseInteger(searchParams.get("minGames") ?? undefined, "minGames");

  if (
    typeof startTimeMs === "number" &&
    typeof endTimeMs === "number" &&
    startTimeMs > endTimeMs
  ) {
    throw new Error("startTimeMs must be less than or equal to endTimeMs.");
  }

  return {
    guildId: guildId?.trim() || undefined,
    startTimeMs,
    endTimeMs,
    minGames,
  };
}
