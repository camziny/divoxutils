import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import prisma from "../../prisma/prismaClient";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { isEffectivelySupporter } from "@/server/supporterStatus";
import {
  getSupporterDeviceGraceSecret,
  SUPPORTER_DEVICE_GRACE_COOKIE_NAME,
  verifySupporterDeviceGraceValue,
} from "@/server/supporterDeviceGrace";

export type LayoutViewerContext = {
  isSupporter: boolean;
  isAdmin: boolean;
  hasSupporterDeviceGrace: boolean;
};

export async function getLayoutViewerContext(): Promise<LayoutViewerContext> {
  let isSupporter = false;
  let isAdmin = false;
  let hasSupporterDeviceGrace = false;

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
    } else {
      const cookieValue = cookies().get(SUPPORTER_DEVICE_GRACE_COOKIE_NAME)?.value;
      hasSupporterDeviceGrace = verifySupporterDeviceGraceValue({
        value: cookieValue,
        secret: getSupporterDeviceGraceSecret(),
      });
    }
  } catch {
    isSupporter = false;
    isAdmin = false;
    hasSupporterDeviceGrace = false;
  }

  return { isSupporter, isAdmin, hasSupporterDeviceGrace };
}
