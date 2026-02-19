import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";

type ClaimRecord = {
  id: number;
  clerkUserId: string;
  provider: string;
  providerUserId: string;
  status: string;
};

type ModerateClaimDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  findClaimById: (id: number) => Promise<ClaimRecord | null>;
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
  updateClaimReview: (data: {
    claimId: number;
    status: string;
    reviewedByClerkUserId?: string;
  }) => Promise<unknown>;
};

export const createModerateClaimHandler =
  (deps: ModerateClaimDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    const authUserId = deps.getAuthUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!deps.isAdminUserId(authUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const claimId = Number(req.body?.claimId);
    const action =
      typeof req.body?.action === "string" ? req.body.action.trim().toLowerCase() : "";

    if (!Number.isInteger(claimId) || claimId <= 0) {
      return res.status(400).json({ error: "claimId must be a positive integer." });
    }

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ error: "action must be approve or reject." });
    }

    const claim = await deps.findClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "pending") {
      return res.status(409).json({ error: "Claim is not pending." });
    }

    if (action === "approve") {
      const existingLink = await deps.findIdentityLinkByProviderUserId(
        claim.provider,
        claim.providerUserId
      );
      if (existingLink && existingLink.clerkUserId !== claim.clerkUserId) {
        return res.status(409).json({
          error: "Cannot approve claim because identity is linked to another account.",
        });
      }

      await deps.upsertIdentityLink({
        clerkUserId: claim.clerkUserId,
        provider: claim.provider,
        providerUserId: claim.providerUserId,
        status: "linked",
      });

      await deps.updateClaimReview({
        claimId,
        status: "approved",
        reviewedByClerkUserId: authUserId,
      });

      return res.status(200).json({
        success: true,
        claimId,
        status: "approved",
      });
    }

    await deps.updateClaimReview({
      claimId,
      status: "rejected",
      reviewedByClerkUserId: authUserId,
    });

    return res.status(200).json({
      success: true,
      claimId,
      status: "rejected",
    });
  };

const handler = createModerateClaimHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  findClaimById: async (id) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.findUnique({
      where: { id },
      select: {
        id: true,
        clerkUserId: true,
        provider: true,
        providerUserId: true,
        status: true,
      },
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
  updateClaimReview: async ({ claimId, status, reviewedByClerkUserId }) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.update({
      where: { id: claimId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedByClerkUserId,
      },
    });
  },
});

export default handler;
