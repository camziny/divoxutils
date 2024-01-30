import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { removeUserFromGroup } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { groupId, clerkUserId } = req.body;

  try {
    const removedUser = await removeUserFromGroup(groupId, clerkUserId);

    res.status(200).json(removedUser);
  } catch (error) {
    console.error("Error removing user from group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
