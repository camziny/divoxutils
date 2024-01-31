import { NextApiRequest, NextApiResponse } from "next";
import { deleteUserCharacterByWebId } from "@/controllers/userCharacterController";
import prisma from "../../../prisma/prismaClient";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { clerkUserId, webId } = req.query;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  if (
    !clerkUserId ||
    typeof clerkUserId !== "string" ||
    !webId ||
    typeof webId !== "string"
  ) {
    res.status(400).json({ message: "Invalid or missing query parameters." });
    return;
  }

  switch (req.method) {
    case "DELETE":
      try {
        await deleteUserCharacterByWebId(
          clerkUserId as string,
          webId as string
        );
        res.status(200).json({
          message: `Character with webId ${webId} successfully deleted.`,
        });
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred." });
        }
      }
      break;
  }
};
