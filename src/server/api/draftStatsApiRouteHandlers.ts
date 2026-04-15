import { NextRequest, NextResponse } from "next/server";
import type { DraftStatsFilters } from "@/server/draftStats";
import {
  getCaptainDraftStats,
  getDraftLogRows,
  getHeadToHeadDraftStats,
  getOverallDraftStats,
  getPlayerDraftDrilldownStats,
} from "@/server/draftStats";
import { parseDraftStatsFiltersFromSearchParams } from "@/server/api/draftStatsQueryParams";
import { jsonMethodNotAllowed } from "@/server/api/routeHandlers";

export function createOverallDraftStatsRouteHandlers(deps?: {
  getOverallRows?: (filters: DraftStatsFilters) => Promise<unknown>;
}) {
  const getOverallRows = deps?.getOverallRows ?? getOverallDraftStats;

  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        return jsonMethodNotAllowed("GET");
      }

      let filters: DraftStatsFilters;
      try {
        filters = parseDraftStatsFiltersFromSearchParams(
          new URL(request.url).searchParams
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid query parameters.";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      try {
        const rows = await getOverallRows(filters);
        return NextResponse.json({ rows, filters });
      } catch {
        return NextResponse.json(
          { error: "Failed to load draft stats." },
          { status: 500 }
        );
      }
    },
  };
}

export function createCaptainDraftStatsRouteHandlers(deps?: {
  getCaptainRows?: (filters: DraftStatsFilters) => Promise<unknown>;
}) {
  const getCaptainRows = deps?.getCaptainRows ?? getCaptainDraftStats;

  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        return jsonMethodNotAllowed("GET");
      }

      let filters: DraftStatsFilters;
      try {
        filters = parseDraftStatsFiltersFromSearchParams(
          new URL(request.url).searchParams
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid query parameters.";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      try {
        const rows = await getCaptainRows(filters);
        return NextResponse.json({ rows, filters });
      } catch {
        return NextResponse.json(
          { error: "Failed to load captain stats." },
          { status: 500 }
        );
      }
    },
  };
}

export function createHeadToHeadDraftStatsRouteHandlers(deps?: {
  getHeadToHeadRow?: (
    playerClerkUserId: string,
    opponentClerkUserId: string,
    filters: DraftStatsFilters
  ) => Promise<unknown>;
}) {
  const getHeadToHeadRow = deps?.getHeadToHeadRow ?? getHeadToHeadDraftStats;

  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        return jsonMethodNotAllowed("GET");
      }

      const searchParams = new URL(request.url).searchParams;
      const playerClerkUserId = searchParams.get("playerClerkUserId")?.trim();
      const opponentClerkUserId = searchParams
        .get("opponentClerkUserId")
        ?.trim();
      if (!playerClerkUserId || !opponentClerkUserId) {
        return NextResponse.json(
          {
            error: "playerClerkUserId and opponentClerkUserId are required.",
          },
          { status: 400 }
        );
      }
      if (playerClerkUserId === opponentClerkUserId) {
        return NextResponse.json(
          { error: "playerClerkUserId and opponentClerkUserId must differ." },
          { status: 400 }
        );
      }

      let filters: DraftStatsFilters;
      try {
        filters = parseDraftStatsFiltersFromSearchParams(searchParams);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid query parameters.";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      try {
        const row = await getHeadToHeadRow(
          playerClerkUserId,
          opponentClerkUserId,
          filters
        );
        return NextResponse.json({ row, filters });
      } catch {
        return NextResponse.json(
          { error: "Failed to load head-to-head stats." },
          { status: 500 }
        );
      }
    },
  };
}

export function createPlayerDraftDrilldownRouteHandlers(deps?: {
  getPlayerDrilldown?: (
    playerClerkUserId: string,
    filters: DraftStatsFilters
  ) => Promise<unknown>;
}) {
  const getPlayerDrilldown = deps?.getPlayerDrilldown ?? getPlayerDraftDrilldownStats;

  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        return jsonMethodNotAllowed("GET");
      }

      const searchParams = new URL(request.url).searchParams;
      const playerClerkUserId = searchParams.get("playerClerkUserId")?.trim();
      if (!playerClerkUserId) {
        return NextResponse.json(
          { error: "playerClerkUserId is required." },
          { status: 400 }
        );
      }

      let filters: DraftStatsFilters;
      try {
        filters = parseDraftStatsFiltersFromSearchParams(searchParams);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid query parameters.";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      try {
        const drilldown = await getPlayerDrilldown(playerClerkUserId, filters);
        return NextResponse.json({ drilldown, filters });
      } catch {
        return NextResponse.json(
          { error: "Failed to load player drilldown." },
          { status: 500 }
        );
      }
    },
  };
}

export function createDraftLogRouteHandlers(deps?: {
  getRows?: () => Promise<unknown>;
}) {
  const getRows = deps?.getRows ?? getDraftLogRows;

  return {
    GET: async (request: NextRequest) => {
      if (request.method !== "GET") {
        return jsonMethodNotAllowed("GET");
      }

      try {
        const rows = await getRows();
        return NextResponse.json({ rows });
      } catch {
        return NextResponse.json(
          { error: "Failed to load draft log." },
          { status: 500 }
        );
      }
    },
  };
}
