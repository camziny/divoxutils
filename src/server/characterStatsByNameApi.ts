import { formatRealmRankWithLevel, getRealmRankForPoints } from "@/utils/character";

type CharacterStatsRecord = {
  characterName: string;
  className: string;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  deathsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
};

export type CharacterStatsByNameDeps = {
  getCharacterStatsByName: (name: string) => Promise<CharacterStatsRecord | null>;
};

export type CharacterStatsByNameInput = {
  method: string;
  apiKey: string | null;
  apiSecret: string | undefined;
  name: string | null;
};

type CharacterStatsByNameResult =
  | { status: number; headers?: Record<string, string>; bodyType: "json"; body: unknown }
  | { status: number; headers?: Record<string, string>; bodyType: "text"; body: string };

export async function handleCharacterStatsByNameApi(
  input: CharacterStatsByNameInput,
  deps: CharacterStatsByNameDeps
): Promise<CharacterStatsByNameResult> {
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
      body: { message: "Character name must be a string." },
    };
  }

  try {
    const characterData = await deps.getCharacterStatsByName(input.name);

    if (!characterData) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: "Character not found" },
      };
    }

    const irs =
      characterData.totalDeaths > 0
        ? Math.round(characterData.totalRealmPoints / characterData.totalDeaths)
        : characterData.totalRealmPoints;

    const irsLastWeek =
      characterData.deathsLastWeek > 0
        ? Math.round(characterData.realmPointsLastWeek / characterData.deathsLastWeek)
        : characterData.realmPointsLastWeek;

    const formattedRank = formatRealmRankWithLevel(
      getRealmRankForPoints(characterData.totalRealmPoints)
    );

    return {
      status: 200,
      bodyType: "json",
      body: {
        characterName: characterData.characterName,
        className: characterData.className,
        formattedRank,
        totalSoloKills: characterData.totalSoloKills,
        totalDeaths: characterData.totalDeaths,
        deathsLastWeek: characterData.deathsLastWeek,
        realmPointsLastWeek: characterData.realmPointsLastWeek,
        soloKillsLastWeek: characterData.soloKillsLastWeek,
        irs,
        irsLastWeek,
      },
    };
  } catch {
    return {
      status: 500,
      bodyType: "json",
      body: { message: "Error fetching character stats" },
    };
  }
}
