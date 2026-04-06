import { createOverallDraftStatsRouteHandlers } from "@/server/api/draftStatsApiRouteHandlers";

const handlers = createOverallDraftStatsRouteHandlers();

export const GET = handlers.GET;
