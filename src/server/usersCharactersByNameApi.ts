import { type ClassType, characterClassesByClassType } from "@/utils/group";
import { findClosestMatch } from "@/utils/levenshtein";
import { formatRealmRankWithLevel, getRealmRankForPoints } from "@/utils/character";

type UserCharacter = {
  characterName: string;
  className: string;
  totalRealmPoints: number;
  realm: string;
  heraldName: string | null;
};

export type UsersCharactersByNameDeps = {
  getAllUserNames: () => Promise<string[]>;
  getUserCharactersByUserName: (userName: string) => Promise<UserCharacter[]>;
};

export type UsersCharactersByNameInput = {
  method: string;
  apiKey: string | null;
  apiSecret: string | undefined;
  name: string | null;
  realm: string | null;
  classType: string | null;
};

type UsersCharactersByNameResult =
  | { status: number; headers?: Record<string, string>; bodyType: "json"; body: unknown }
  | { status: number; headers?: Record<string, string>; bodyType: "text"; body: string };

function toRealmFilter(realm: string | null) {
  if (!realm) {
    return null;
  }

  const realmAbbreviations: Record<string, string> = {
    mid: "Midgard",
    alb: "Albion",
    hib: "Hibernia",
  };

  return realmAbbreviations[realm.toLowerCase()] ?? realm;
}

function toClassTypeFilter(classType: string | null): ClassType | null {
  if (!classType) {
    return null;
  }

  const normalized = `${classType.charAt(0).toUpperCase()}${classType
    .slice(1)
    .toLowerCase()}`;

  if (!["Tank", "Caster", "Support", "Stealth"].includes(normalized)) {
    return null;
  }

  return normalized as ClassType;
}

export async function handleUsersCharactersByNameApi(
  input: UsersCharactersByNameInput,
  deps: UsersCharactersByNameDeps
): Promise<UsersCharactersByNameResult> {
  if (!input.apiKey || input.apiKey !== input.apiSecret) {
    return {
      status: 401,
      bodyType: "json",
      body: { message: "Invalid or missing API key." },
    };
  }

  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: "GET" },
      bodyType: "text",
      body: `Method ${input.method} Not Allowed`,
    };
  }

  if (!input.name) {
    return {
      status: 400,
      bodyType: "json",
      body: { message: "User name must be a string." },
    };
  }

  const classTypeFilter = toClassTypeFilter(input.classType);
  if (input.classType && !classTypeFilter) {
    return {
      status: 400,
      bodyType: "json",
      body: { message: "Invalid classType." },
    };
  }

  const realmFilter = toRealmFilter(input.realm);

  try {
    const allUserNames = await deps.getAllUserNames();
    const closestUserName =
      allUserNames.length > 0 ? findClosestMatch(input.name, allUserNames) : null;

    if (closestUserName === null) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: `User ${input.name} not found` },
      };
    }

    const userCharacters = await deps.getUserCharactersByUserName(closestUserName);
    if (!userCharacters || userCharacters.length === 0) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: "No characters found for this user." },
      };
    }

    const filteredCharacters = userCharacters.filter((character) => {
      const realmMatches = realmFilter
        ? character.realm.toLowerCase() === realmFilter.toLowerCase()
        : true;
      const classTypeMatches = classTypeFilter
        ? characterClassesByClassType[classTypeFilter].includes(character.className)
        : true;
      return realmMatches && classTypeMatches;
    });

    if (filteredCharacters.length === 0) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: "No characters found for this user." },
      };
    }

    const characters = filteredCharacters
      .sort((a, b) => b.totalRealmPoints - a.totalRealmPoints)
      .map((character) => {
        const formattedRank = formatRealmRankWithLevel(
          getRealmRankForPoints(character.totalRealmPoints)
        );
        return {
          characterName: character.characterName,
          className: character.className,
          heraldName: character.heraldName,
          formattedRank,
        };
      });

    return {
      status: 200,
      bodyType: "json",
      body: {
        user: closestUserName,
        characters,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { status: 500, bodyType: "json", body: { message: error.message } };
    }
    return {
      status: 500,
      bodyType: "json",
      body: { message: "An unknown error occurred." },
    };
  }
}
