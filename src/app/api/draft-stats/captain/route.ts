import { createCaptainDraftStatsRouteHandlers } from "@/server/api/draftStatsApiRouteHandlers";

const handlers = createCaptainDraftStatsRouteHandlers();

export const GET = handlers.GET;
