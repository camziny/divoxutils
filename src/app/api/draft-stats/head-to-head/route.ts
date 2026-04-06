import { createHeadToHeadDraftStatsRouteHandlers } from "@/server/api/draftStatsApiRouteHandlers";

const handlers = createHeadToHeadDraftStatsRouteHandlers();

export const GET = handlers.GET;
