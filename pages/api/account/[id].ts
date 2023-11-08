import { getAccountById } from "../../../src/controllers/accountController";
import { NextApiRequest, NextApiResponse } from "next";

const handleGetAccountById = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.method === "GET" && typeof req.query.id === "string") {
      const id = parseInt(req.query.id);
      const account = await getAccountById(id);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handleGetAccountById;
