import { NextApiResponse, NextApiRequest } from "next";
import { fetchCharacterDetails } from "../../../src/controllers/characterController";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const { name, cluster } = req.query;
      const characters = await fetchCharacterDetails(
        name as string,
        cluster as string
      );
      res.status(200).json(characters);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
