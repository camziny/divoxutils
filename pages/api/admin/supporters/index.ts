import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import prisma from "../../../../prisma/prismaClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!getAdminClerkUserIds().includes(userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const supporters = await prisma.user.findMany({
    where: { supporterTier: { gt: 0 } },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      supporterTier: true,
      supporterAmount: true,
    },
    orderBy: [{ supporterTier: "desc" }, { name: "asc" }],
  });

  return res.status(200).json({ supporters });
}
