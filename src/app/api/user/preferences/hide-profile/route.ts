import { revalidateTag } from "next/cache";
import prisma from "../../../../../../prisma/prismaClient";
import {
  type HideProfileApiDeps,
} from "@/server/hideProfileApi";
import { createHideProfileRouteHandlers } from "@/server/hideProfileRouteHandlers";
import { getClerkAuthUserId } from "@/server/clerkAuth";

const deps: HideProfileApiDeps = {
  findUserHideProfile: (clerkUserId: string) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { hideProfile: true },
    }),
  findUserByClerkId: (clerkUserId: string) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    }),
  updateUserHideProfile: (clerkUserId: string, hideProfile: boolean) =>
    prisma.user.update({
      where: { clerkUserId },
      data: { hideProfile },
      select: { hideProfile: true },
    }),
  revalidatePublicProfile: () => revalidateTag("public-user-profile"),
};

const handlers = createHideProfileRouteHandlers({
  getAuthUserId: getClerkAuthUserId,
  apiDeps: deps,
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
