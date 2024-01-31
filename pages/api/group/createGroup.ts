import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import { createNewGroup } from "@/controllers/groupController";
import { getUserByClerkUserId } from "@/controllers/userController";
import * as yup from "yup";

const createGroupSchema = yup.object({
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
    const validatedData = await createGroupSchema.validate(req.body);
    const {
      realm,
      groupOwner,
      public: publicStatus,
      activeUsers,
      rosterUsers,
    } = validatedData;

    const user = await getUserByClerkUserId(groupOwner);
    if (!user) {
      return res.status(404).json({ error: "Group owner not found." });
    }

    const groupOwnerName = user.name as string;

    const result = await createNewGroup(
      realm,
      groupOwnerName,
      publicStatus,
      groupOwner,
      activeUsers,
      rosterUsers
    );

    res.status(200).json({
      message: "Group created successfully",
      result,
    });
  } catch (error) {
    console.error("Error creating the group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
