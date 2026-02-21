import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";

type SearchAccountsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
  isAdminUserId: (userId: string) => boolean;
  findDiscordIdentityLinks: (providerUserId: string) => Promise<{ clerkUserId: string }[]>;
  findClerkUserIdsByDiscordName: (query: string) => Promise<string[]>;
  findUsers: (args: { query: string; identityClerkIds: string[] }) => Promise<
    Array<{
      id: number;
      clerkUserId: string;
      name: string | null;
      email: string;
      characters: Array<{
        character: {
          id: number;
          characterName: string;
          className: string;
          realm: string;
          totalRealmPoints: number;
        };
      }>;
      identityLinks: Array<{ provider: string; providerUserId: string }>;
      _count: { groupUsers: number; identityClaims: number };
    }>
  >;
};

export function createAdminAccountSearchHandler(deps: SearchAccountsDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = deps.getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!deps.isAdminUserId(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 2) {
      return res.status(200).json({ users: [] });
    }

    const [byIdentityLink, byDiscordName] = await Promise.all([
      deps.findDiscordIdentityLinks(query),
      deps.findClerkUserIdsByDiscordName(query),
    ]);
    const identityClerkIds = Array.from(
      new Set([...byIdentityLink.map((link) => link.clerkUserId), ...byDiscordName])
    );

    const users = await deps.findUsers({ query, identityClerkIds });
    const results = users.map((u) => ({
      id: u.id,
      clerkUserId: u.clerkUserId,
      name: u.name,
      email: u.email,
      characters: u.characters.map((uc) => uc.character),
      identityLinks: u.identityLinks,
      groupCount: u._count.groupUsers,
      claimCount: u._count.identityClaims,
    }));

    return res.status(200).json({ users: results });
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = require("../../../../prisma/prismaClient").default;
  const { clerkClient } = require("@clerk/nextjs");
  return createAdminAccountSearchHandler({
    getAuthUserId: (request) => getAuth(request).userId,
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
        const clerkUsers = await clerkClient.users.getUserList({ limit: 100, query });
        return clerkUsers
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
            ...(identityClerkIds.length > 0
              ? [{ clerkUserId: { in: identityClerkIds } }]
              : []),
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
  })(req, res);
}
