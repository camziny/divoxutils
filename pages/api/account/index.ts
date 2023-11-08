import { getAccounts } from "../../../src/controllers/accountController";
import { NextApiRequest, NextApiResponse } from "next";

const handleGetAccounts = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method === "GET") {
      const accounts = await getAccounts();
      res.json(accounts);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handleGetAccounts;
