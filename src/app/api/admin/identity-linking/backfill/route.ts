import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import { getDiscordExternalAccountId } from "@/server/linkDiscordIdentityApi";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { createAdminIdentityBackfillRouteHandlers } from "@/server/adminIdentityBackfillRouteHandlers";

const handlers = createAdminIdentityBackfillRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  listUnlinkedLocalUsers: ({ afterId, take }) =>
    prisma.user.findMany({
      where: {
        ...(afterId ? { id: { gt: afterId } } : {}),
        identityLinks: {
          none: {
            provider: "discord",
          },
        },
      },
      select: {
        id: true,
        clerkUserId: true,
      },
      orderBy: {
        id: "asc",
      },
      take,
    }),
  getDiscordUserIdFromClerk: async (clerkUserId) => {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    return getDiscordExternalAccountId(clerkUser);
  },
  findLinkByProviderUserId: (provider, providerUserId) =>
    prisma.userIdentityLink.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      select: {
        clerkUserId: true,
      },
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
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
