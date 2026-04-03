import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createCancelDraftRouteHandlers } from "@/server/adminDraftsRouteHandlers";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

const handlers = createCancelDraftRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  cancelDraft: async (args) => {
    const convex = getConvexClient();
    return convex.mutation("drafts:cancelDraftAsAdmin" as any, args);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
