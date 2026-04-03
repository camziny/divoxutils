import { auth } from "@clerk/nextjs/server";
import { hasVerifiedDraftParticipantByDiscordUserId } from "@/server/discordIdentity";
import { createDiscordStatusRouteHandlers } from "@/server/discordStatusRouteHandlers";
import prisma from "../../../../../prisma/prismaClient";

const handlers = createDiscordStatusRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    findIdentityLink: (clerkUserId) =>
      prisma.userIdentityLink.findUnique({
        where: {
          clerkUserId_provider: {
            clerkUserId,
            provider: "discord",
          },
        },
        select: { providerUserId: true, status: true },
      }),
    findPendingClaim: (clerkUserId) =>
      prisma.userIdentityClaim.findFirst({
        where: {
          clerkUserId,
          provider: "discord",
          status: "pending",
        },
        select: { providerUserId: true, status: true },
      }),
    hasDraftRowsForDiscordUserId: hasVerifiedDraftParticipantByDiscordUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
