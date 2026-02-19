import { NextApiRequest, NextApiResponse } from "next";
import { DraftStatsFilters, getCaptainDraftStats } from "@/server/draftStats";

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseNumber(value: string | undefined, fieldName: string): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
}

function parseInteger(value: string | undefined, fieldName: string): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return parsed;
}

function parseFilters(req: NextApiRequest): DraftStatsFilters {
  const guildId = getSingleQueryValue(req.query.guildId);
  const startTimeMs = parseNumber(
    getSingleQueryValue(req.query.startTimeMs),
    "startTimeMs"
  );
  const endTimeMs = parseNumber(getSingleQueryValue(req.query.endTimeMs), "endTimeMs");
  const minGames = parseInteger(getSingleQueryValue(req.query.minGames), "minGames");

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

export function createCaptainDraftStatsHandler(deps?: {
  getCaptainRows?: (filters: DraftStatsFilters) => Promise<unknown>;
}) {
  const getCaptainRows = deps?.getCaptainRows ?? getCaptainDraftStats;

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    let filters: DraftStatsFilters;
    try {
      filters = parseFilters(req);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message ?? "Invalid query parameters." });
    }

    try {
      const rows = await getCaptainRows(filters);
      return res.status(200).json({ rows, filters });
    } catch (error) {
      return res.status(500).json({ error: "Failed to load captain stats." });
    }
  };
}

export default createCaptainDraftStatsHandler();
