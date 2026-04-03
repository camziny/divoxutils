import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { createClaimDiscordIdentityRouteHandlers } from "@/server/claimDiscordIdentityRouteHandlers";

const handlers = createClaimDiscordIdentityRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    findLocalUserByClerkId: (clerkUserId) =>
      prisma.user.findUnique({
        where: { clerkUserId },
        select: { clerkUserId: true },
      }),
    findIdentityLinkByProviderUserId: (provider, providerUserId) =>
      prisma.userIdentityLink.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId,
          },
        },
        select: { clerkUserId: true },
      }),
    findPendingClaim: ({ clerkUserId, provider, providerUserId }) =>
      prisma.userIdentityClaim.findFirst({
        where: {
          clerkUserId,
          provider,
          providerUserId,
          status: "pending",
        },
        select: { id: true },
      }),
    createClaim: ({ clerkUserId, provider, providerUserId, draftId, status }) =>
      prisma.userIdentityClaim.create({
        data: {
          clerkUserId,
          provider,
          providerUserId,
          draftId,
          status,
        },
        select: {
          id: true,
          status: true,
        },
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
