import { NextApiRequest, NextApiResponse } from "next";
import { revalidateTag } from "next/cache";
import * as userCharacterController from "../../../../src/controllers/userCharacterController";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clerkUserId, characterId: characterIdStr } = req.query;

  const characterId = parseInt(characterIdStr as string, 10);

  if (isNaN(characterId)) {
    res.status(400).json({ message: "Invalid characterId." });
    return;
  }

  if (!clerkUserId || Array.isArray(clerkUserId)) {
    res.status(400).json({ message: "clerkUserId must be a single string." });
    return;
  }

  const compoundKey = { clerkUserId, characterId };

  switch (req.method) {
    case "GET":
      try {
        const userCharacter =
          await userCharacterController.getUserCharacterById(compoundKey);
        if (userCharacter) {
          res.status(200).json(userCharacter);
        } else {
          res.status(404).json({ message: "UserCharacter not found." });
        }
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
        const userCharacter =
          await userCharacterController.getUserCharacterById({
            clerkUserId: clerkUserId as string,
            characterId,
          });

        if (!userCharacter) {
          console.warn(
            `UserCharacter with userId ${clerkUserId} and characterId ${characterId} not found.`
          );
          res.status(404).json({
            message: `UserCharacter with userId ${clerkUserId} and characterId ${characterId} not found.`,
          });
          return;
        }

        if (userCharacter.clerkUserId !== clerkUserId) {
          console.warn("Unauthorized operation: Mismatched userIds.");
          res.status(403).json({
            message:
              "Unauthorized operation: User does not own this character.",
          });
          return;
        }

        await userCharacterController.deleteUserCharacter({
          clerkUserId: clerkUserId as string,
          characterId,
        });

        revalidateTag(`user-characters-${clerkUserId}`);
        revalidateTag(`other-characters-${clerkUserId}`);
        
        res.status(200).json({ message: "Character successfully deleted" });
      } catch (error) {
        console.error(
          `Error deleting character with userId ${clerkUserId} and characterId ${characterId} :`,
          error
        );
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
