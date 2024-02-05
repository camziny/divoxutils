// File: pages/api/group/group-owner.ts

import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { clerkUserId, groupId } = req.query;

  try {
    const groupUser = await prisma.groupUser.findFirst({
      where: {
        groupId: parseInt(groupId as string),
        clerkUserId: clerkUserId as string,
      },
    });

    if (!groupUser) {
      return res.status(404).json({ message: "Group user not found" });
    }

    let character = null;
    if (groupUser.characterId) {
      character = await prisma.character.findUnique({
        where: { id: groupUser.characterId },
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUserId as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user,
      character,
      isInActiveGroup: groupUser.isInActiveGroup,
    });
  } catch (error) {
    console.error("Error fetching group owner with active character:", error);
    res.status(500).json({ error: "Server error" });
  }
}
