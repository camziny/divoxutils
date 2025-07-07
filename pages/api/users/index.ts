import { NextApiRequest, NextApiResponse } from "next";
import * as userController from "../../../src/controllers/userController";
import { getUsersByPartialName } from "../../../src/controllers/userController";

export const handleGetUsers = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    case "GET":
      try {
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        
        const name = req.query.name;
        const characterName = req.query.characterName;
        if (characterName && typeof characterName === "string") {
          const users = await userController.getUserByCharacterName(
            characterName
          );
          res.status(200).json(users);
        } else if (name && typeof name === "string") {
          const exactUserMatch = await userController.getUserByName(name);
          if (exactUserMatch.length > 0) {
            res.status(200).json(exactUserMatch);
          } else {
            const users = await userController.getUsersByPartialName(name);
            res.status(200).json(users);
          }
        } else {
          const users = await userController.getUsers();
          res.status(200).json(users);
        }
      } catch (error) {
        console.error("Error in /api/users:", error);
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handleGetUsers;
