import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";
import prisma from "../../../../prisma/prismaClient";

const TIER_THRESHOLDS = [
  { tier: 3, min: 100 },
  { tier: 2, min: 50 },
  { tier: 1, min: 20 },
];

function tierForAmount(amount: number): number {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (amount >= min) return tier;
  }
  return 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!getAdminClerkUserIds().includes(userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const clerkUserId = typeof req.body?.clerkUserId === "string" ? req.body.clerkUserId.trim() : "";
  const addAmount = Number(req.body?.addAmount);

  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required." });
  }

  if (isNaN(addAmount) || addAmount <= 0) {
    return res.status(400).json({ error: "addAmount must be a positive number." });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, name: true, supporterAmount: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const newAmount = user.supporterAmount + addAmount;
  const newTier = tierForAmount(newAmount);

  await prisma.user.update({
    where: { clerkUserId },
    data: {
      supporterAmount: newAmount,
      supporterTier: newTier,
    },
  });

  return res.status(200).json({
    success: true,
    clerkUserId,
    supporterAmount: newAmount,
    supporterTier: newTier,
  });
}
