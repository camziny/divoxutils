import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminSupportersUpdateRouteHandlers } from "@/server/adminSupportersRouteHandlers";

function tierForAmount(amount: number): number {
  if (amount >= 100) return 3;
  if (amount >= 50) return 2;
  if (amount >= 20) return 1;
  return 0;
}

const handlers = createAdminSupportersUpdateRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  applySupporterContribution: ({ clerkUserId, addAmount }) =>
    prisma.$transaction(async (tx) => {
      let row: { supporterAmount: number };
      try {
        row = await tx.user.update({
          where: { clerkUserId },
          data: {
            supporterAmount: { increment: addAmount },
          },
          select: {
            supporterAmount: true,
          },
        });
      } catch (error: any) {
        if (error?.code === "P2025") {
          return null;
        }
        throw error;
      }

      if (!row) {
        return null;
      }
      const supporterTier = tierForAmount(row.supporterAmount);
      await tx.user.update({
        where: { clerkUserId },
        data: { supporterTier },
      });
      return {
        supporterAmount: row.supporterAmount,
        supporterTier,
      };
    });
  },
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
