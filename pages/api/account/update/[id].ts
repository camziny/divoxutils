import { updateAccount } from "../../../../src/controllers/accountController";
import { NextApiRequest, NextApiResponse } from "next";

const handleUpdateAccount = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.method === "PUT" && typeof req.query.id === "string") {
      const id = parseInt(req.query.id);
      const updatedAccount = await updateAccount(id, req.body);
      res.json(updatedAccount);
    } else {
      res.status(405).end();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export default handleUpdateAccount;
