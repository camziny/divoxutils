import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminDraftsRouteHandlers } from "@/server/adminDraftsRouteHandlers";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

const handlers = createAdminDraftsRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  purgeExpiredCancelledDrafts: async () => {
    const convex = getConvexClient();
    return convex.mutation("drafts:purgeExpiredCancelledDrafts" as any, {
      retentionDays: 90,
    });
  },
  listPendingDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getDraftsForModeration" as any, {});
  },
  listReviewedDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getReviewedDraftsForModeration" as any, {});
  },
  listCancelableDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getCancelableDrafts" as any, {});
  },
  listCancelledDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getCancelledDraftsForAdmin" as any, {});
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
