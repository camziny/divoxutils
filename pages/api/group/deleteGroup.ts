import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { deleteGroupById } from "@/controllers/groupController";

const deleteGroupSchema = yup.object({
  groupId: yup.number().positive().integer().required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const adminSecret = process.env.ADMIN_SECRET;
  const requestSecret = req.headers["x-admin-secret"];

  if (!adminSecret || adminSecret !== requestSecret) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const validatedData = await deleteGroupSchema.validate(req.body);
    const { groupId } = validatedData;

    const result = await deleteGroupById(groupId);

    res.status(200).json({
      message: "Group deleted successfully",
      result,
    });
  } catch (error) {
    console.error("Error deleting the group:", error);
    res.status(500).json({ error: "Server error" });
  }
}
