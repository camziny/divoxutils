import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "../../../../../../prisma/prismaClient";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import { createAdminAccountSearchRouteHandlers } from "@/server/adminAccountsRouteHandlers";

const handlers = createAdminAccountSearchRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  findDiscordIdentityLinks: (providerUserId) =>
    prisma.userIdentityLink.findMany({
      where: {
        provider: "discord",
        providerUserId,
      },
      select: { clerkUserId: true },
    }),
  findClerkUserIdsByDiscordName: async (query) => {
    const normalized = query.toLowerCase();
    try {
      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({ limit: 100, query });
      return clerkUsers.data
        .filter((user: any) => {
          const accounts = Array.isArray(user?.externalAccounts) ? user.externalAccounts : [];
          return accounts.some((account: any) => {
            const provider = String(account?.provider ?? account?.providerId ?? "").toLowerCase();
            if (!provider.includes("discord")) {
              return false;
            }
            const candidates = [
              account?.username,
              account?.displayName,
              account?.externalUsername,
            ]
              .filter((value: unknown) => typeof value === "string")
              .map((value: string) => value.toLowerCase());
            return candidates.some((value) => value.includes(normalized));
          });
        })
        .map((user: any) => String(user?.id ?? ""))
        .filter(Boolean);
    } catch {
      return [];
    }
  },
  findUsers: ({ query, identityClerkIds }) =>
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(identityClerkIds.length > 0 ? [{ clerkUserId: { in: identityClerkIds } }] : []),
        ],
      },
      select: {
        id: true,
        clerkUserId: true,
        name: true,
        email: true,
        characters: {
          select: {
            character: {
              select: {
                id: true,
                characterName: true,
                className: true,
                realm: true,
                totalRealmPoints: true,
              },
            },
          },
        },
        identityLinks: {
          select: {
            provider: true,
            providerUserId: true,
          },
        },
        _count: {
          select: {
            groupUsers: true,
            identityClaims: true,
          },
        },
      },
      take: 15,
      orderBy: { name: "asc" },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
