import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { getGroupByUser } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { clerkUserId } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUserId as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.method === "GET") {
      const group = await getGroupByUser(user.clerkUserId);
      if (group) {
        res.status(200).json(group);
      } else {
        res.status(404).json({ message: "Group not found for the user" });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error in group handler:", error);
    res.status(500).json({ error: "Server error" });
  }
}
