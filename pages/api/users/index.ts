import { NextApiRequest, NextApiResponse } from "next";
import * as userController from "../../../src/controllers/userController";
import { generateToken } from "@/utils/auth";
import { setCookie } from "@/utils/cookies";
import { getUsersByPartialName } from "../../../src/controllers/userController";

export const handleGetUsers = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  switch (req.method) {
    case "GET":
      try {
        const name = req.query.name;
        if (name && typeof name === "string") {
          const users = await getUsersByPartialName(name);
          res.status(200).json(users);
        } else {
          const users = await userController.getUsers();
          res.status(200).json(users);
        }
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

export default handleGetUsers;
