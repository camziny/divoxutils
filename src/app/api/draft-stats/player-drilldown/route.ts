import { createPlayerDraftDrilldownRouteHandlers } from "@/server/api/draftStatsApiRouteHandlers";

const handlers = createPlayerDraftDrilldownRouteHandlers();

export const GET = handlers.GET;
