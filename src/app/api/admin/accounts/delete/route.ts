import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminAccountDeleteRouteHandlers } from "@/server/adminAccountsRouteHandlers";

const handlers = createAdminAccountDeleteRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  findLocalUser: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, name: true },
    }),
  deleteLocalUserData: ({ clerkUserId, userId }) =>
    prisma
      .$transaction([
        prisma.groupUser.deleteMany({ where: { clerkUserId } }),
        prisma.userCharacter.deleteMany({ where: { clerkUserId } }),
        prisma.account.deleteMany({ where: { userId } }),
        prisma.user.deleteMany({ where: { clerkUserId } }),
      ])
      .then(() => undefined),
  deleteClerkUser: async (clerkUserId) => {
    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);
  },
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
