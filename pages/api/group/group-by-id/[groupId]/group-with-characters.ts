import prisma from "../../../../../prisma/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { groupId } = req.query;

  try {
    const groupIdNumber = parseInt(groupId as string);
    if (isNaN(groupIdNumber)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const groupUsers = await prisma.groupUser.findMany({
      where: { groupId: groupIdNumber },
      include: {
        user: true,
      },
    });

    const groupUsersWithCharacters = await Promise.all(
      groupUsers.map(async (groupUser) => {
        let character = null;
        if (groupUser.characterId) {
          character = await prisma.userCharacter.findUnique({
            where: {
              clerkUserId_characterId: {
                clerkUserId: groupUser.clerkUserId,
                characterId: groupUser.characterId,
              },
            },
            include: { character: true },
          });
        }
        return {
          ...groupUser,
          character: character ? character.character : null,
        };
      })
    );
    res.status(200).json(groupUsersWithCharacters);
  } catch (error) {
    console.error("Error fetching group with characters:", error);
    res.status(500).json({ error: "Server error" });
  }
}
