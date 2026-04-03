import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminSupportersSearchRouteHandlers } from "@/server/adminSupportersRouteHandlers";

const handlers = createAdminSupportersSearchRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  searchUsers: (query) =>
    prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        clerkUserId: true,
        name: true,
        supporterTier: true,
        supporterAmount: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
