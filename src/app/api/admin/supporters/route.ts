import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminSupportersListRouteHandlers } from "@/server/adminSupportersRouteHandlers";

const handlers = createAdminSupportersListRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  findSupporters: () =>
    prisma.user.findMany({
      where: { supporterTier: { gt: 0 } },
      select: {
        id: true,
        clerkUserId: true,
        name: true,
        supporterTier: true,
        supporterAmount: true,
      },
      orderBy: [{ supporterTier: "desc" }, { name: "asc" }],
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
