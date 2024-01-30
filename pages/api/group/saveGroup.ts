import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import {
  saveGroupDetails,
  createNewGroup,
} from "@/controllers/groupController"; // Ensure createNewGroup is also imported
import * as yup from "yup";

const saveGroupSchema = yup.object({
  groupId: yup.number().positive().integer().notRequired(),
  realm: yup.string().required(),
  groupOwner: yup.string().required(),
  public: yup.boolean().required(),
  activeUsers: yup
    .array()
    .of(
      yup.object({
        clerkUserId: yup.string().required(),
        selectedCharacterId: yup.number().integer().positive().notRequired(),
      })
    )
    .required(),
  rosterUsers: yup
    .array()
    .of(
      yup.object({
        clerkUserId: yup.string().required(),
        selectedCharacterId: yup.number().integer().positive().notRequired(),
      })
    )
    .required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const validatedData = await saveGroupSchema.validate(req.body);
    const {
      groupId,
      realm,
      groupOwner,
      public: publicStatus,
      activeUsers,
      rosterUsers,
    } = validatedData;

    const groupOwnerName = await getUserNameByClerkUserId(groupOwner);

    if (!groupOwnerName) {
      return res.status(404).json({ error: "Group owner not found." });
    }

    let result;
    if (groupId) {
      result = await saveGroupDetails(
        groupId,
        realm,
        publicStatus,
        activeUsers,
        rosterUsers
      );
    } else {
      result = await createNewGroup(
        realm,
        groupOwnerName,
        publicStatus,
        groupOwner,
        activeUsers,
        rosterUsers
      );
    }

    res.status(200).json({
      message: groupId
        ? "Group updated successfully"
        : "Group created successfully",
      result,
    });
  } catch (error) {
    console.error("Error saving the group:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function getUserNameByClerkUserId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUserId },
  });
  return user ? user.name : null;
}
