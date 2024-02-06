import prisma from "../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { addUserToGroup } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { groupId, memberClerkUserId } = req.body;
  console.log(
    `API received addUser request: groupId=${groupId}, memberClerkUserId=${memberClerkUserId}`
  );

  try {
    const addedUser = await addUserToGroup(groupId, memberClerkUserId);
    console.log(`API successfully added user to group: `, addedUser);
    res.status(200).json(addedUser);
  } catch (error) {
    console.error("Error adding user to group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
