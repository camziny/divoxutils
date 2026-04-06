import { createDraftLogRouteHandlers } from "@/server/api/draftStatsApiRouteHandlers";

const handlers = createDraftLogRouteHandlers();

export const GET = handlers.GET;
