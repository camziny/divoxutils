import { NextApiRequest, NextApiResponse } from "next";
import { deleteCookie } from "../../../src/utils/cookies";

const signout = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      deleteCookie(res, "authToken");
      res.status(200).json({ message: "Successfully signed out" });
    } catch (error) {
      res.status(500).json({ message: "Failed to sign out" });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default signout;
