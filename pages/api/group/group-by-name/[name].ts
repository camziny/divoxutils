import prisma from "../../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserGroupByName } from "@/controllers/groupController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;

  try {
    if (req.method === "GET") {
      const group = await getUserGroupByName(name as string);
      if (group) {
        res.status(200).json(group);
      } else {
        res
          .status(404)
          .json({ message: "Group not found with the given name" });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error in group handler:", error);
    res.status(500).json({ error: "Server error" });
  }
}
