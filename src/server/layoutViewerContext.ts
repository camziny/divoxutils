import { auth } from "@clerk/nextjs/server";
import prisma from "../../prisma/prismaClient";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { isEffectivelySupporter } from "@/server/supporterStatus";

export type LayoutViewerContext = {
  isSupporter: boolean;
  isAdmin: boolean;
};

export async function getLayoutViewerContext(): Promise<LayoutViewerContext> {
  let isSupporter = false;
  let isAdmin = false;

  try {
    const { userId } = await auth();
    isAdmin = isAdminClerkUserId(userId);
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          supporterTier: true,
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });
      isSupporter = isEffectivelySupporter(user);
    }
  } catch {
    isSupporter = false;
    isAdmin = false;
  }

  return { isSupporter, isAdmin };
}
