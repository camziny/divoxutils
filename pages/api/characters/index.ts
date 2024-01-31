import { NextApiResponse, NextApiRequest } from "next";
import * as characterController from "../../../src/controllers/characterController";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../prisma/prismaClient";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const authDetails = getAuth(req);
  const clerkUserId = authDetails.userId;

  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUserId },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found in our database." });
  }

  switch (req.method) {
    case "GET":
      try {
        const characters = await characterController.getCharacters();
        res.status(200).json(characters);
      } catch (error) {
        handleError(res, error);
      }
      break;
    case "POST":
      try {
        if (!Array.isArray(req.body.webIds)) {
          throw new Error("Expected an array of webIds.");
        }
        const foundUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (!foundUser) {
          throw new Error(`No user found with ID: ${user.id}`);
        }
        const characters = await characterController.addCharactersToUserList(
          req.body.webIds,
          user.id
        );
        res.status(201).json(characters);
      } catch (error) {
        console.error(
          `Error in POST /api/characters for userId ${user.id}:`,
          error
        );
        handleError(res, error);
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

function handleError(res: NextApiResponse, error: any) {
  if (error instanceof Error) {
    res.status(500).json({ message: error.message });
  } else {
    res.status(500).json({ message: "An unknown error occurred" });
  }
}
