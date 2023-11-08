import { createAccount } from "../../../src/controllers/accountController";
import { NextApiRequest, NextApiResponse } from "next";

const handleCreateAccount = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.method === "POST") {
      const account = await createAccount(req.body);
      res.json(account);
    } else {
      res.status(405).end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handleCreateAccount;
