import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { hasVerifiedDraftParticipantByDiscordUserId } from "@/server/discordIdentity";

type DiscordStatusDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  findIdentityLink: (
    clerkUserId: string
  ) => Promise<{ providerUserId: string; status: string } | null>;
  findPendingClaim: (
    clerkUserId: string
  ) => Promise<{ providerUserId: string; status: string } | null>;
  hasDraftRowsForDiscordUserId: (discordUserId: string) => Promise<boolean>;
};

export const createDiscordStatusHandler =
  (deps: DiscordStatusDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const link = await deps.findIdentityLink(clerkUserId);
    if (link) {
      const hasAnyDraftRowsForLinkedId = await deps.hasDraftRowsForDiscordUserId(
        link.providerUserId
      );
      return res.status(200).json({
        linked: true,
        providerUserId: link.providerUserId,
        status: link.status,
        hasAnyDraftRowsForLinkedId,
        possibleMismatch: !hasAnyDraftRowsForLinkedId,
      });
    }

    const pendingClaim = await deps.findPendingClaim(clerkUserId);
    if (pendingClaim) {
      return res.status(200).json({
        linked: false,
        pendingClaim: true,
        providerUserId: pendingClaim.providerUserId,
      });
    }

    return res.status(200).json({ linked: false, pendingClaim: false });
  };

const handler = createDiscordStatusHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  findIdentityLink: async (clerkUserId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityLink.findUnique({
      where: {
        clerkUserId_provider: {
          clerkUserId,
          provider: "discord",
        },
      },
      select: { providerUserId: true, status: true },
    });
  },
  findPendingClaim: async (clerkUserId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.findFirst({
      where: {
        clerkUserId,
        provider: "discord",
        status: "pending",
      },
      select: { providerUserId: true, status: true },
    });
  },
  hasDraftRowsForDiscordUserId: async (discordUserId) => {
    return hasVerifiedDraftParticipantByDiscordUserId(discordUserId);
  },
});

export default handler;
