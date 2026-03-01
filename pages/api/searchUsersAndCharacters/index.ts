import { NextApiRequest, NextApiResponse } from "next";

type Character = {
  characterName: string;
  heraldName: string | null;
  className: string;
  heraldClassName: string;
  totalRealmPoints: number;
};

type UserWithCharacters = {
  id: number;
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
  characters: { character: Character }[];
};

type SearchUsersAndCharactersDeps = {
  findUsers: (args: {
    normalizedQuery: string;
  }) => Promise<UserWithCharacters[]>;
};

const normalizeValue = (value: string) => value.trim().toLowerCase();

const getMatchScore = (value: string | null | undefined, query: string) => {
  if (!value) return 0;
  const normalizedValue = normalizeValue(value);
  if (normalizedValue === query) return 3;
  if (normalizedValue.startsWith(query)) return 2;
  if (normalizedValue.includes(query)) return 1;
  return 0;
};

const getMatchPosition = (value: string | null | undefined, query: string) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const normalizedValue = normalizeValue(value);
  const index = normalizedValue.indexOf(query);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
};

export function createSearchUsersAndCharactersHandler(
  deps: SearchUsersAndCharactersDeps
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Name must be provided and must be a string" });
    }

    const normalizedQuery = normalizeValue(name);
    if (normalizedQuery.length < 3) {
      return res.status(200).json({ users: [] });
    }

    try {
      const users = await deps.findUsers({
        normalizedQuery,
      });

      const userResults = users
        .map((user) => {
          const rankedCharacters = user.characters
            .map((uc) => {
              const heraldName = uc.character.heraldName;
              const score = getMatchScore(heraldName, normalizedQuery);
              const position = getMatchPosition(heraldName, normalizedQuery);
              return {
                score,
                position,
                characterName: uc.character.characterName,
                heraldName: heraldName ?? "",
                className: uc.character.className,
                totalRealmPoints: uc.character.totalRealmPoints,
                heraldClassName: uc.character.heraldClassName,
              };
            })
            .filter((character) => character.score > 0)
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (a.position !== b.position) return a.position - b.position;
              return a.heraldName.localeCompare(b.heraldName);
            });

          const bestCharacterScore = rankedCharacters[0]?.score ?? 0;
          const bestCharacterPosition =
            rankedCharacters[0]?.position ?? Number.MAX_SAFE_INTEGER;
          const userNameScore = getMatchScore(user.name, normalizedQuery);
          const userNamePosition = getMatchPosition(user.name, normalizedQuery);
          const bestScore = Math.max(userNameScore, bestCharacterScore);
          const bestPosition = Math.min(userNamePosition, bestCharacterPosition);

          return {
            id: user.id,
            clerkUserId: user.clerkUserId,
            name: user.name,
            supporterTier: user.supporterTier ?? 0,
            score: bestScore,
            userNameScore,
            userNamePosition,
            bestPosition,
            characters: rankedCharacters.map(
              ({ score, position, ...character }) => character
            ),
          };
        })
        .filter((user) => user.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.userNameScore !== a.userNameScore) {
            return b.userNameScore - a.userNameScore;
          }
          if (a.bestPosition !== b.bestPosition) return a.bestPosition - b.bestPosition;
          if (a.userNamePosition !== b.userNamePosition) {
            return a.userNamePosition - b.userNamePosition;
          }
          return (a.name ?? "").localeCompare(b.name ?? "");
        })
        .map(({ score, userNameScore, userNamePosition, bestPosition, ...user }) => user);

      return res.status(200).json({ users: userResults });
    } catch (error) {
      console.error("Error fetching search results:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = require("../../../prisma/prismaClient").default;
  return createSearchUsersAndCharactersHandler({
    findUsers: ({ normalizedQuery }) =>
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            {
              characters: {
                some: {
                  character: {
                    heraldName: {
                      contains: normalizedQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          characters: {
            where: {
              character: {
                heraldName: {
                  contains: normalizedQuery,
                  mode: "insensitive",
                },
              },
            },
            include: {
              character: true,
            },
          },
        },
      }) as Promise<UserWithCharacters[]>,
  })(req, res);
}
