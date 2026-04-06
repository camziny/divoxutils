import { findClosestMatch } from "@/utils/levenshtein";

type UserStatsCharacter = {
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  deathsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  lastUpdated: Date | null;
};

type UserStatsRecord = {
  name: string | null;
  characters: { character: UserStatsCharacter }[];
};

export type UsersStatsByNameDeps = {
  getAllUserNames: () => Promise<string[]>;
  getUserStatsByName: (name: string) => Promise<UserStatsRecord | null>;
};

export type UsersStatsByNameInput = {
  method: string;
  apiKey: string | null;
  apiSecret: string | undefined;
  name: string | null;
};

type UsersStatsByNameResult =
  | { status: number; headers?: Record<string, string>; bodyType: "json"; body: unknown }
  | { status: number; headers?: Record<string, string>; bodyType: "text"; body: string };

export async function handleUsersStatsByNameApi(
  input: UsersStatsByNameInput,
  deps: UsersStatsByNameDeps
): Promise<UsersStatsByNameResult> {
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

    const userData = await deps.getUserStatsByName(closestUserName);
    if (!userData) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: "User not found" },
      };
    }

    let totalPoints = 0;
    let totalSoloKills = 0;
    let totalDeaths = 0;
    let deathsLastWeek = 0;
    let realmPointsLastWeek = 0;
    let soloKillsLastWeek = 0;
    let latestUpdate: Date | null = null;

    userData.characters.forEach((userCharacter) => {
      const character = userCharacter.character;
      totalPoints += character.totalRealmPoints;
      totalSoloKills += character.totalSoloKills;
      totalDeaths += character.totalDeaths;

      if (character.realmPointsLastWeek !== character.totalRealmPoints) {
        realmPointsLastWeek += character.realmPointsLastWeek;
      }
      if (character.soloKillsLastWeek !== character.totalSoloKills) {
        soloKillsLastWeek += character.soloKillsLastWeek;
      }
      if (character.deathsLastWeek !== character.totalDeaths) {
        deathsLastWeek += character.deathsLastWeek;
      }

      if (character.lastUpdated && (!latestUpdate || character.lastUpdated > latestUpdate)) {
        latestUpdate = character.lastUpdated;
      }
    });

    const irs = totalDeaths > 0 ? Math.round(totalPoints / totalDeaths) : totalPoints;
    const irsLastWeek =
      deathsLastWeek > 0
        ? Math.round(realmPointsLastWeek / deathsLastWeek)
        : realmPointsLastWeek;

    return {
      status: 200,
      bodyType: "json",
      body: {
        userName: userData.name,
        totalRealmPoints: totalPoints,
        totalSoloKills,
        totalDeaths,
        deathsLastWeek,
        realmPointsLastWeek,
        soloKillsLastWeek,
        irs,
        irsLastWeek,
        lastUpdated: latestUpdate,
      },
    };
  } catch {
    return {
      status: 500,
      bodyType: "json",
      body: { message: "Error fetching user stats" },
    };
  }
}
