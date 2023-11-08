import { NextApiRequest, NextApiResponse } from "next";
import * as userController from "../../../src/controllers/userController";
import { getUserByClerkUserId } from "../../../src/controllers/userController";
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { clerkUserId, id } = req.query;

  switch (req.method) {
    case "GET":
      try {
        const user = await getUserByClerkUserId(clerkUserId as string);
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;
    case "PUT":
      try {
        const user = await userController.updateUser(Number(id), req.body);
        res.status(200).json(user);
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;

    case "DELETE":
      try {
        await userController.deleteUser(Number(id));
        res.status(204).end();
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
