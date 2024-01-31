import prisma from "../../../../../prisma/prismaClient";
import { getUsersByGroup } from "@/controllers/groupController";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { groupId } = req.query;

  try {
    const groupIdNumber = parseInt(groupId as string);
    if (isNaN(groupIdNumber)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await getUsersByGroup(groupIdNumber);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.groupUsers || group.groupUsers.length === 0) {
      return res.status(404).json({ message: "No users in the group" });
    }

    res.status(200).json(
      group.groupUsers.map((groupUser) => ({
        ...groupUser.user,
        isInActiveGroup: groupUser.isInActiveGroup,
      }))
    );
  } catch (error) {
    console.error("Error fetching users for group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
