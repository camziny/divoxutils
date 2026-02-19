import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

type ClaimIdentityDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  findLocalUserByClerkId: (clerkUserId: string) => Promise<{ clerkUserId: string } | null>;
  findIdentityLinkByProviderUserId: (
    provider: string,
    providerUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  findPendingClaim: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
  }) => Promise<{ id: number } | null>;
  createClaim: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
    draftId?: string;
    status: string;
  }) => Promise<{ id: number; status: string }>;
};

export const createClaimDiscordIdentityHandler =
  (deps: ClaimIdentityDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const discordUserId =
      typeof req.body?.discordUserId === "string" ? req.body.discordUserId.trim() : "";
    const draftId =
      typeof req.body?.draftId === "string" && req.body.draftId.trim()
        ? req.body.draftId.trim()
        : undefined;

    if (!discordUserId) {
      return res.status(400).json({ error: "discordUserId is required." });
    }

    const localUser = await deps.findLocalUserByClerkId(clerkUserId);
    if (!localUser) {
      return res.status(404).json({ error: "User not found." });
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

    const pendingClaim = await deps.findPendingClaim({
      clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
    });
    if (pendingClaim) {
      return res.status(409).json({ error: "A pending claim already exists." });
    }

    const claim = await deps.createClaim({
      clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      draftId,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      claimId: claim.id,
      clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      status: claim.status,
    });
  };

const handler = createClaimDiscordIdentityHandler({
  getAuthUserId: (req) => getAuth(req).userId,
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
  findPendingClaim: async ({ clerkUserId, provider, providerUserId }) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.findFirst({
      where: {
        clerkUserId,
        provider,
        providerUserId,
        status: "pending",
      },
      select: { id: true },
    });
  },
  createClaim: async ({ clerkUserId, provider, providerUserId, draftId, status }) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.create({
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
    });
  },
});

export default handler;
