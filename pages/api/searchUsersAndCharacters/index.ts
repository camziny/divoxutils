import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/prismaClient";

type Character = {
  characterName: string;
  heraldName: string;
  className: string;
  heraldClassName: string;
  totalRealmPoints: number;
};

type UserWithCharacters = {
  id: number;
  clerkUserId: string;
  name: string | null;
  characters: { character: Character }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Name must be provided and must be a string" });
    }

    try {
      const users = (await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: name, mode: "insensitive" } },
            {
              characters: {
                some: {
                  character: {
                    heraldName: { contains: name, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
        include: {
          characters: {
            include: {
              character: true,
            },
          },
        },
      })) as UserWithCharacters[];

      const userResults = users.map((user) => ({
        id: user.id,
        clerkUserId: user.clerkUserId,
        name: user.name,
        characters: user.characters
          .filter((uc) =>
            uc.character.heraldName.toLowerCase().includes(name.toLowerCase())
          )
          .map((uc) => ({
            characterName: uc.character.characterName,
            heraldName: uc.character.heraldName,
            className: uc.character.className,
            totalRealmPoints: uc.character.totalRealmPoints,
            heraldClassName: uc.character.heraldClassName,
          })),
      }));

      res.status(200).json({ users: userResults });
    } catch (error) {
      console.error("Error fetching search results:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
