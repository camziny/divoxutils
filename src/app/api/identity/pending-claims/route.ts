import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createPendingClaimsRouteHandlers } from "@/server/pendingClaimsRouteHandlers";

const handlers = createPendingClaimsRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
    listPendingClaims: () =>
      prisma.userIdentityClaim.findMany({
        where: { status: "pending" },
        select: {
          id: true,
          clerkUserId: true,
          provider: true,
          providerUserId: true,
          draftId: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
