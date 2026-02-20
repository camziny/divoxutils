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

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2) {
    return res.status(200).json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      supporterTier: true,
      supporterAmount: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return res.status(200).json({ users });
}
