import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import {
  type LayoutPreferenceApiDeps,
} from "@/server/layoutPreferenceApi";
import { createLayoutPreferenceRouteHandlers } from "@/server/layoutPreferenceRouteHandlers";

const deps: LayoutPreferenceApiDeps = {
  findUserLayout: (clerkUserId: string) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { preferredCharacterListLayout: true },
    }),
  findUserByClerkId: (clerkUserId: string) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    }),
  updateUserLayout: (clerkUserId: string, layout: "table" | "realm-grid") =>
    prisma.user.update({
      where: { clerkUserId },
      data: { preferredCharacterListLayout: layout },
      select: { preferredCharacterListLayout: true },
    }),
};

const handlers = createLayoutPreferenceRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  apiDeps: deps,
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const POST = handlers.POST;
