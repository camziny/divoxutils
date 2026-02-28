import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { getDiscordExternalAccountId } from "../../identity/link-discord";

type BackfillSummary = {
  scannedUsers: number;
  linked: number;
  skippedNoDiscord: number;
  skippedMissingClerkUser: number;
  skippedAlreadyLinkedToOther: number;
  skippedErrors: number;
  errors: Array<{ clerkUserId: string; reason: string }>;
};

type AdminIdentityBackfillDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  listUnlinkedLocalUsers: (args: {
    afterId?: number;
    take: number;
  }) => Promise<Array<{ id: number; clerkUserId: string }>>;
  getDiscordUserIdFromClerk: (clerkUserId: string) => Promise<string | null>;
  findLinkByProviderUserId: (
    provider: string,
    providerUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  upsertIdentityLink: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
    status: string;
  }) => Promise<unknown>;
};

const BATCH_SIZE = 100;

function isClerkNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; errors?: Array<{ code?: string }> };
  if (maybe.status === 404) return true;
  if (Array.isArray(maybe.errors) && maybe.errors.some((entry) => entry?.code === "resource_not_found")) {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("not found");
}

export function createAdminIdentityBackfillHandler(deps: AdminIdentityBackfillDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = deps.getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!deps.isAdminUserId(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsedCursor =
      typeof req.body?.cursor === "number" && Number.isFinite(req.body.cursor)
        ? Math.floor(req.body.cursor)
        : undefined;
    const cursor = parsedCursor && parsedCursor > 0 ? parsedCursor : undefined;
    const users = await deps.listUnlinkedLocalUsers({
      afterId: cursor,
      take: BATCH_SIZE + 1,
    });
    const hasMore = users.length > BATCH_SIZE;
    const batchUsers = hasMore ? users.slice(0, BATCH_SIZE) : users;
    const nextCursor = hasMore
      ? batchUsers[batchUsers.length - 1]?.id ?? null
      : null;

    const summary: BackfillSummary = {
      scannedUsers: batchUsers.length,
      linked: 0,
      skippedNoDiscord: 0,
      skippedMissingClerkUser: 0,
      skippedAlreadyLinkedToOther: 0,
      skippedErrors: 0,
      errors: [],
    };

    for (const user of batchUsers) {
      try {
        const discordUserId = await deps.getDiscordUserIdFromClerk(user.clerkUserId);
        if (!discordUserId) {
          summary.skippedNoDiscord += 1;
          continue;
        }

        const existing = await deps.findLinkByProviderUserId("discord", discordUserId);
        if (existing && existing.clerkUserId !== user.clerkUserId) {
          summary.skippedAlreadyLinkedToOther += 1;
          continue;
        }

        await deps.upsertIdentityLink({
          clerkUserId: user.clerkUserId,
          provider: "discord",
          providerUserId: discordUserId,
          status: "linked",
        });
        summary.linked += 1;
      } catch (error: unknown) {
        if (isClerkNotFoundError(error)) {
          summary.skippedMissingClerkUser += 1;
          continue;
        }
        summary.skippedErrors += 1;
        summary.errors.push({
          clerkUserId: user.clerkUserId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.status(200).json({
      batch: summary,
      progress: {
        hasMore,
        nextCursor,
      },
    });
  };
}

const handler = createAdminIdentityBackfillHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  listUnlinkedLocalUsers: async ({ afterId, take }) => {
    const prismaClient = require("../../../../prisma/prismaClient").default;
    return prismaClient.user.findMany({
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
    });
  },
  getDiscordUserIdFromClerk: async (clerkUserId) => {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    return getDiscordExternalAccountId(clerkUser);
  },
  findLinkByProviderUserId: async (provider, providerUserId) => {
    const prismaClient = require("../../../../prisma/prismaClient").default;
    return prismaClient.userIdentityLink.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      select: {
        clerkUserId: true,
      },
    });
  },
  upsertIdentityLink: async ({ clerkUserId, provider, providerUserId, status }) => {
    const prismaClient = require("../../../../prisma/prismaClient").default;
    return prismaClient.userIdentityLink.upsert({
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
    });
  },
});

export default handler;
