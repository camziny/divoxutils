import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";

type LinkIdentityDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  resolveDiscordUserIdFromClerk: (clerkUserId: string) => Promise<string | null>;
  findLocalUserByClerkId: (clerkUserId: string) => Promise<{ clerkUserId: string } | null>;
  findIdentityLinkByProviderUserId: (
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

function getDiscordExternalAccountId(clerkUser: any): string | null {
  const externalAccounts = Array.isArray(clerkUser?.externalAccounts)
    ? clerkUser.externalAccounts
    : [];

  for (const account of externalAccounts) {
    const provider = String(account?.provider ?? account?.providerId ?? "").toLowerCase();
    if (!provider.includes("discord")) {
      continue;
    }
    if (typeof account?.providerUserId === "string" && account.providerUserId.trim()) {
      return account.providerUserId.trim();
    }
  }

  return null;
}

export const createLinkDiscordIdentityHandler =
  (deps: LinkIdentityDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const localUser = await deps.findLocalUserByClerkId(clerkUserId);
    if (!localUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const bodyDiscordUserId =
      typeof req.body?.discordUserId === "string" ? req.body.discordUserId.trim() : "";
    const discordUserId =
      bodyDiscordUserId || (await deps.resolveDiscordUserIdFromClerk(clerkUserId));

    if (!discordUserId) {
      return res.status(400).json({
        error: "Unable to determine Discord user id for this account.",
      });
    }

    const existingLink = await deps.findIdentityLinkByProviderUserId(
      "discord",
      discordUserId
    );

    if (existingLink && existingLink.clerkUserId !== clerkUserId) {
      return res.status(409).json({
        error: "Discord user is already linked to another account.",
      });
    }

    await deps.upsertIdentityLink({
      clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      status: "linked",
    });

    return res.status(200).json({
      success: true,
      clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      status: "linked",
    });
  };

const handler = createLinkDiscordIdentityHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  resolveDiscordUserIdFromClerk: async (clerkUserId) => {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    return getDiscordExternalAccountId(clerkUser);
  },
  findLocalUserByClerkId: async (clerkUserId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    });
  },
  findIdentityLinkByProviderUserId: async (provider, providerUserId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityLink.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      select: { clerkUserId: true },
    });
  },
  upsertIdentityLink: async ({ clerkUserId, provider, providerUserId, status }) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
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
