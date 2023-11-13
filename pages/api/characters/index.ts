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
        console.log("POST Request Body:", req.body);
        if (!Array.isArray(req.body.webIds)) {
          throw new Error("Expected an array of webIds.");
        }
        console.log(`Attempting to find user with ID: ${user.id}`);
        const foundUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        console.log("Found User:", foundUser);

        console.log(`Attempting to add characters for user ID: ${user.id}`);
        const characters = await characterController.addCharactersToUserList(
          req.body.webIds,
          user.id
        );
        console.log("Characters added:", characters);
        res.status(201).json(characters);
      } catch (error) {
        console.error("Error in POST request:", error);
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
