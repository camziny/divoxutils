import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getDiscordExternalAccountId } from "@/server/linkDiscordIdentityApi";
import { createLinkDiscordIdentityRouteHandlers } from "@/server/linkDiscordIdentityRouteHandlers";

const handlers = createLinkDiscordIdentityRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    resolveDiscordUserIdFromClerk: async (clerkUserId) => {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      return getDiscordExternalAccountId(clerkUser);
    },
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
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
