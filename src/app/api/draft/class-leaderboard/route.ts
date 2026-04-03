import { getClassDraftStats } from "@/server/draftStats";
import { createDraftClassLeaderboardRouteHandlers } from "@/server/draftClassLeaderboardRouteHandlers";

const handlers = createDraftClassLeaderboardRouteHandlers({
  deps: {
    getClassDraftStats: (className: string) => getClassDraftStats(className, {}),
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
