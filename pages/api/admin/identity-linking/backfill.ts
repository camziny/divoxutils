import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { getDiscordExternalAccountId } from "../../identity/link-discord";

type BackfillSummary = {
  scannedUsers: number;
  linked: number;
  skippedNoDiscord: number;
  skippedAlreadyLinkedToOther: number;
  skippedErrors: number;
  errors: Array<{ clerkUserId: string; reason: string }>;
};

type AdminIdentityBackfillDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  listUnlinkedLocalUsers: (limit?: number) => Promise<Array<{ clerkUserId: string }>>;
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

    const dryRun = req.body?.dryRun !== false;
    const parsedLimit =
      typeof req.body?.limit === "number" && Number.isFinite(req.body.limit)
        ? Math.floor(req.body.limit)
        : undefined;
    const limit =
      parsedLimit && parsedLimit > 0 ? Math.min(parsedLimit, 2000) : undefined;

    const users = await deps.listUnlinkedLocalUsers(limit);

    const summary: BackfillSummary = {
      scannedUsers: users.length,
      linked: 0,
      skippedNoDiscord: 0,
      skippedAlreadyLinkedToOther: 0,
      skippedErrors: 0,
      errors: [],
    };

    for (const user of users) {
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

        if (!dryRun) {
          await deps.upsertIdentityLink({
            clerkUserId: user.clerkUserId,
            provider: "discord",
            providerUserId: discordUserId,
            status: "linked",
          });
        }
        summary.linked += 1;
      } catch (error: unknown) {
        summary.skippedErrors += 1;
        summary.errors.push({
          clerkUserId: user.clerkUserId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.status(200).json({
      dryRun,
      limit: limit ?? null,
      summary,
    });
  };
}

const handler = createAdminIdentityBackfillHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  listUnlinkedLocalUsers: async (limit) => {
    const prismaClient = require("../../../../prisma/prismaClient").default;
    return prismaClient.user.findMany({
      where: {
        identityLinks: {
          none: {
            provider: "discord",
          },
        },
      },
      select: {
        clerkUserId: true,
      },
      orderBy: {
        id: "asc",
      },
      ...(limit ? { take: limit } : {}),
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
