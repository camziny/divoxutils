import { NextApiRequest, NextApiResponse } from "next";
import * as characterController from "../../../src/controllers/characterController";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).json({ message: "Character ID must be a string." });
    return;
  }

  switch (req.method) {
    case "GET":
      try {
        const character = await characterController.getCharacterById(
          Number(id)
        );
        if (character) {
          res.status(200).json(character);
        } else {
          res.status(404).json({ message: "Character not found." });
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
        const updatedCharacter = await characterController.updateCharacter(
          Number(id),
          req.body
        );
        res.status(200).json(updatedCharacter);
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
        await characterController.deleteCharacter(Number(id));
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

export default handler;
