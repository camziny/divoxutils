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
        const name = req.query.name;
        if (name && typeof name === "string") {
          const users = await getUsersByPartialName(name);
          res.status(200).json(users);
        } else {
          console.log("Fetching all users");
          const users = await userController.getUsers();
          console.log("Found users:", users);
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
      console.log(`Method ${req.method} not allowed for /api/users`);
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handleGetUsers;
