import { NextApiRequest, NextApiResponse } from "next";
import { loginUser } from "../../../src/controllers/userController";
import { generateToken } from "@/utils/auth";
import { setCookie } from "@/utils/cookies";

const handleLoginUser = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      const user = await loginUser(req.body);
      const token = generateToken(user);
      setCookie(res, "authToken", token);
      res.status(200).json({ message: "Login Successful", token });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res
          .status(500)
          .json({ message: "An unknown error occurred during login" });
      }
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handleLoginUser;
