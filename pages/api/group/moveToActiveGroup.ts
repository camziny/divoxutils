import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { moveUserToActiveGroup } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { groupId, clerkUserId } = req.body;

  try {
    const updatedUser = await moveUserToActiveGroup(groupId, clerkUserId);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error moving user to active group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
