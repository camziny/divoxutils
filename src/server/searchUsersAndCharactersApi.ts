type Character = {
  characterName: string;
  heraldName: string | null;
  className: string;
  heraldClassName: string | null;
  totalRealmPoints: number;
};

type UserWithCharacters = {
  id: number;
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
  characters: { character: Character }[];
};

export type SearchUsersAndCharactersDeps = {
  findUsers: (args: {
    normalizedQuery: string;
  }) => Promise<UserWithCharacters[]>;
};

export type SearchUsersAndCharactersApiInput = {
  method: string;
  nameQuery: unknown;
};

type SearchUsersAndCharactersApiResult =
  | {
      status: number;
      headers?: Record<string, string | string[]>;
      bodyType: "text";
      body: string;
    }
  | {
      status: number;
      headers?: Record<string, string | string[]>;
      bodyType: "json";
      body: unknown;
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

export async function handleSearchUsersAndCharactersApi(
  input: SearchUsersAndCharactersApiInput,
  deps: SearchUsersAndCharactersDeps
): Promise<SearchUsersAndCharactersApiResult> {
  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: ["GET"] },
      bodyType: "text",
      body: `Method ${input.method} Not Allowed`,
    };
  }

  if (!input.nameQuery || typeof input.nameQuery !== "string") {
    return {
      status: 400,
      bodyType: "json",
      body: { message: "Name must be provided and must be a string" },
    };
  }

  const normalizedQuery = normalizeValue(input.nameQuery);
  if (normalizedQuery.length < 3) {
    return {
      status: 200,
      bodyType: "json",
      body: { users: [] },
    };
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

    return {
      status: 200,
      bodyType: "json",
      body: { users: userResults },
    };
  } catch (error) {
    console.error("Error fetching search results:", error);
    return {
      status: 500,
      bodyType: "json",
      body: { message: "Internal Server Error" },
    };
  }
}
