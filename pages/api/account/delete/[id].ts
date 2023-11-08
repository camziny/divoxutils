import { deleteAccount } from "../../../../src/controllers/accountController";
import { NextApiRequest, NextApiResponse } from "next";

const handleDeleteAccount = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.method === "DELETE" && typeof req.query.id === "string") {
      const id = parseInt(req.query.id);
      await deleteAccount(id);
      res.status(204).end();
    } else {
      res.status(405).end();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handleDeleteAccount;
