import { NextApiResponse } from "next";
import * as userCharacterController from "../../../src/controllers/userCharacterController";
import authenticate from "../../../src/middleware/authenticate";
import { AuthenticatedRequest } from "@/utils/types";
import { getAuth } from "@clerk/nextjs/server";

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (!req.method) {
    res.status(405).end("Method Not Defined");
    return;
  }
  const userId = req.user?.clerkUserId;
  console.log("Database URL:", process.env.DATABASE_URL);

  if (["POST", "DELETE"].includes(req.method)) {
    if (!userId) {
      res.status(403).json({ message: "User not authenticated" });
      return;
    }
  }
  switch (req.method) {
    case "GET":
      try {
        const userToViewId =
          typeof req.query.clerkUserId === "string"
            ? req.query.clerkUserId
            : userId;
        if (!userToViewId) {
          res.status(403).json({ message: "User ID required" });
          return;
        }
        const userCharacters = await userCharacterController.getUserCharacters(
          userToViewId
        );
        res.status(200).json(userCharacters);
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;
    case "POST":
      try {
        const authDetails = getAuth(req);
        const clerkUserId = authDetails.userId;

        if (!clerkUserId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const characterId = req.body.characterId;

        const userCharacter = await userCharacterController.createUserCharacter(
          {
            clerkUserId,
            characterId,
          }
        );
        res.status(201).json(userCharacter);
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
export default (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (["POST", "DELETE"].includes(req.method!)) {
    return authenticate(handler)(req, res);
  } else {
    return handler(req, res);
  }
};
