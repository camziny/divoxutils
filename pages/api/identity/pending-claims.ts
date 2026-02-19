import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";

type PendingClaim = {
  id: number;
  clerkUserId: string;
  provider: string;
  providerUserId: string;
  draftId: string | null;
  status: string;
  createdAt: Date;
};

type PendingClaimsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  listPendingClaims: () => Promise<PendingClaim[]>;
};

export const createPendingClaimsHandler =
  (deps: PendingClaimsDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authUserId = deps.getAuthUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!deps.isAdminUserId(authUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const claims = await deps.listPendingClaims();
    return res.status(200).json({ claims });
  };

const handler = createPendingClaimsHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
  listPendingClaims: async () => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userIdentityClaim.findMany({
      where: { status: "pending" },
      select: {
        id: true,
        clerkUserId: true,
        provider: true,
        providerUserId: true,
        draftId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
});

export default handler;
