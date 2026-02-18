import prisma from "../../prisma/prismaClient";
import { unstable_cache } from "next/cache";

type LeaderboardCharacter = {
  id: number;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  totalDeathBlows: number;
  deathsLastWeek: number;
  deathBlowsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  lastUpdated: Date | null;
  heraldRealmPoints: number | null;
  heraldTotalDeaths: number | null;
  heraldTotalSoloKills: number | null;
  heraldTotalDeathBlows: number | null;
};

type LeaderboardUserInput = {
  id: number;
  name: string | null;
  clerkUserId: string;
  characters: Array<{
    character: LeaderboardCharacter;
  }>;
};

export type LeaderboardItem = {
  userId: number;
  clerkUserId: string;
  userName: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  soloKillsThisWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  deathsThisWeek: number;
  totalDeathBlows: number;
  deathBlowsLastWeek: number;
  deathBlowsThisWeek: number;
  irs: number;
  irsLastWeek: number;
  irsThisWeek: number;
  lastUpdated: Date | null;
};

export const aggregateLeaderboardData = (
  leaderboardData: LeaderboardUserInput[]
): LeaderboardItem[] => {
  const aggregated = leaderboardData.map((user) => {
    let totalPoints = 0;
    let totalSoloKills = 0;
    let totalDeaths = 0;
    let totalDeathBlows = 0;
    let deathsLastWeek = 0;
    let deathBlowsLastWeek = 0;
    let realmPointsLastWeek = 0;
    let soloKillsLastWeek = 0;
    let latestUpdate: Date | null = null;

    let accumulatedRealmPointsThisWeek = 0;
    let accumulatedDeathsThisWeek = 0;
    let accumulatedSoloKillsThisWeek = 0;
    let accumulatedDeathBlowsThisWeek = 0;

    const processedCharacterIds = new Set<number>();

    user.characters.forEach(({ character }) => {
      if (processedCharacterIds.has(character.id)) {
        return;
      }

      processedCharacterIds.add(character.id);

      totalPoints += character.totalRealmPoints;
      totalSoloKills += character.totalSoloKills;
      totalDeaths += character.totalDeaths;
      totalDeathBlows += character.totalDeathBlows;

      if (character.realmPointsLastWeek !== character.totalRealmPoints) {
        realmPointsLastWeek += character.realmPointsLastWeek;
      }
      if (character.soloKillsLastWeek !== character.totalSoloKills) {
        soloKillsLastWeek += character.soloKillsLastWeek;
      }
      if (character.deathsLastWeek !== character.totalDeaths) {
        deathsLastWeek += character.deathsLastWeek;
      }
      if (character.deathBlowsLastWeek !== character.totalDeathBlows) {
        deathBlowsLastWeek += character.deathBlowsLastWeek;
      }

      if (character.lastUpdated && (!latestUpdate || character.lastUpdated > latestUpdate)) {
        latestUpdate = character.lastUpdated;
      }

      if (
        character.heraldRealmPoints !== null &&
        character.totalRealmPoints !== null
      ) {
        accumulatedRealmPointsThisWeek +=
          character.heraldRealmPoints - character.totalRealmPoints;
      }
      if (
        character.heraldTotalDeaths !== null &&
        character.totalDeaths !== null
      ) {
        accumulatedDeathsThisWeek +=
          character.heraldTotalDeaths - character.totalDeaths;
      }
      if (
        character.heraldTotalSoloKills !== null &&
        character.totalSoloKills !== null
      ) {
        accumulatedSoloKillsThisWeek +=
          character.heraldTotalSoloKills - character.totalSoloKills;
      }
      if (
        character.heraldTotalDeathBlows !== null &&
        character.totalDeathBlows !== null
      ) {
        accumulatedDeathBlowsThisWeek +=
          character.heraldTotalDeathBlows - character.totalDeathBlows;
      }
    });

    const realmPointsThisWeek = Math.max(0, accumulatedRealmPointsThisWeek);
    const deathsThisWeek = Math.max(0, accumulatedDeathsThisWeek);
    const soloKillsThisWeek = Math.max(0, accumulatedSoloKillsThisWeek);
    const deathBlowsThisWeek = Math.max(0, accumulatedDeathBlowsThisWeek);

    const irs = totalDeaths > 0 ? Math.round(totalPoints / totalDeaths) : totalPoints;
    const irsLastWeek =
      deathsLastWeek > 0 ? Math.round(realmPointsLastWeek / deathsLastWeek) : realmPointsLastWeek;
    const irsThisWeek =
      deathsThisWeek > 0 ? Math.round(realmPointsThisWeek / deathsThisWeek) : realmPointsThisWeek;

    return {
      userId: user.id,
      clerkUserId: user.clerkUserId,
      userName: user.name ?? "Unknown",
      totalRealmPoints: totalPoints,
      totalSoloKills,
      totalDeaths,
      totalDeathBlows,
      deathsLastWeek,
      deathBlowsLastWeek,
      realmPointsLastWeek,
      soloKillsLastWeek,
      irs,
      irsLastWeek,
      lastUpdated: latestUpdate,
      realmPointsThisWeek,
      deathsThisWeek,
      soloKillsThisWeek,
      deathBlowsThisWeek,
      irsThisWeek,
    };
  });

  return aggregated.sort((a, b) => b.totalRealmPoints - a.totalRealmPoints);
};

const getLeaderboardDataUncached = async (): Promise<LeaderboardItem[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      clerkUserId: true,
      characters: {
        select: {
          character: {
            select: {
              id: true,
              totalRealmPoints: true,
              totalSoloKills: true,
              totalDeaths: true,
              totalDeathBlows: true,
              deathsLastWeek: true,
              deathBlowsLastWeek: true,
              realmPointsLastWeek: true,
              soloKillsLastWeek: true,
              lastUpdated: true,
              heraldRealmPoints: true,
              heraldTotalDeaths: true,
              heraldTotalSoloKills: true,
              heraldTotalDeathBlows: true,
            },
          },
        },
      },
    },
  });

  return aggregateLeaderboardData(users);
};

const getCachedLeaderboardData = unstable_cache(
  getLeaderboardDataUncached,
  ["leaderboard-data"],
  { revalidate: 60 }
);

export const getLeaderboardData = async (): Promise<LeaderboardItem[]> => {
  return getCachedLeaderboardData();
};
