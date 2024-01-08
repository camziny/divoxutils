import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { getGroupByUser } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { username } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { name: username as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await getGroupByUser(user.clerkUserId);
    if (group) {
      res.status(200).json(group);
    } else {
      res.status(404).json({ message: "Group not found for the user" });
    }
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
