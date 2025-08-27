import { NextApiRequest, NextApiResponse } from "next";
import * as userCharacterController from "../../../src/controllers/userCharacterController";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    res.status(400).json({ message: "User ID must be a string." });
    return;
  }

  const userId = id;

  switch (req.method) {
    case "GET":
      try {
        const userCharacters =
          await userCharacterController.getUserCharactersByUserId(userId);
        if (userCharacters && userCharacters.length > 0) {
          res.status(200).json(userCharacters);
        } else {
          res
            .status(404)
            .json({ message: "No characters found for this user." });
        }
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred." });
        }
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
