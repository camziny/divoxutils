import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createModerateClaimRouteHandlers } from "@/server/moderateClaimRouteHandlers";

const handlers = createModerateClaimRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
    findClaimById: (id) =>
      prisma.userIdentityClaim.findUnique({
        where: { id },
        select: {
          id: true,
          clerkUserId: true,
          provider: true,
          providerUserId: true,
          status: true,
        },
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
    upsertIdentityLink: ({ clerkUserId, provider, providerUserId, status }) =>
      prisma.userIdentityLink.upsert({
        where: {
          clerkUserId_provider: {
            clerkUserId,
            provider,
          },
        },
        update: {
          providerUserId,
          status,
        },
        create: {
          clerkUserId,
          provider,
          providerUserId,
          status,
        },
      }),
    updateClaimReview: ({ claimId, status, reviewedByClerkUserId }) =>
      prisma.userIdentityClaim.update({
        where: { id: claimId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedByClerkUserId,
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
