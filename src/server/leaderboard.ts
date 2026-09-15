import prisma from "../../prisma/prismaClient";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getClassChampionWebIdsForCharacters } from "@/server/classChampionStore";
import { normalizeChampionClassName } from "@/utils/championClassName";

type LeaderboardCharacter = {
  id: number;
  totalRealmPoints: number;
  totalKills: number;
  totalSoloKills: number;
  totalDeaths: number;
  totalDeathBlows: number;
  killsLastWeek: number;
  deathsLastWeek: number;
  deathBlowsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  lastUpdated: Date | null;
  heraldRealmPoints: number | null;
  heraldTotalKills: number | null;
  heraldTotalDeaths: number | null;
  heraldTotalSoloKills: number | null;
  heraldTotalDeathBlows: number | null;
  webId: string;
  heraldClassName: string | null;
  realm: string;
};

export type LeaderboardChampionClass = {
  className: string;
  realm: string;
};

type LeaderboardUserInput = {
  id: number;
  name: string | null;
  clerkUserId: string;
  supporterTier?: number;
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
  totalKills: number;
  killsLastWeek: number;
  killsThisWeek: number;
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
  supporterTier: number;
  championClasses: LeaderboardChampionClass[];
};

export const aggregateLeaderboardData = (
  leaderboardData: LeaderboardUserInput[],
  championWebIds: Set<string> = new Set()
): LeaderboardItem[] => {
  const aggregated = leaderboardData.map((user) => {
    let totalPoints = 0;
    let totalKills = 0;
    let totalSoloKills = 0;
    let totalDeaths = 0;
    let totalDeathBlows = 0;
    let killsLastWeek = 0;
    let deathsLastWeek = 0;
    let deathBlowsLastWeek = 0;
    let realmPointsLastWeek = 0;
    let soloKillsLastWeek = 0;
    let latestUpdate: Date | null = null;

    let accumulatedRealmPointsThisWeek = 0;
    let accumulatedKillsThisWeek = 0;
    let accumulatedDeathsThisWeek = 0;
    let accumulatedSoloKillsThisWeek = 0;
    let accumulatedDeathBlowsThisWeek = 0;

    const processedCharacterIds = new Set<number>();
    const championClassKeys = new Set<string>();
    const championClasses: LeaderboardChampionClass[] = [];

    user.characters.forEach(({ character }) => {
      if (processedCharacterIds.has(character.id)) {
        return;
      }

      processedCharacterIds.add(character.id);

      if (championWebIds.has(character.webId)) {
        const className = normalizeChampionClassName(
          character.heraldClassName ?? undefined
        );
        const key = `${className}|${character.realm}`;
        if (className && !championClassKeys.has(key)) {
          championClassKeys.add(key);
          championClasses.push({ className, realm: character.realm });
        }
      }

      const effectiveRealmPoints =
        character.heraldRealmPoints ?? character.totalRealmPoints;
      const effectiveTotalKills =
        character.heraldTotalKills ?? character.totalKills;
      const effectiveTotalSoloKills =
        character.heraldTotalSoloKills ?? character.totalSoloKills;
      const effectiveTotalDeaths =
        character.heraldTotalDeaths ?? character.totalDeaths;
      const effectiveTotalDeathBlows =
        character.heraldTotalDeathBlows ?? character.totalDeathBlows;

      totalPoints += effectiveRealmPoints;
      totalKills += effectiveTotalKills;
      totalSoloKills += effectiveTotalSoloKills;
      totalDeaths += effectiveTotalDeaths;
      totalDeathBlows += effectiveTotalDeathBlows;

      if (character.realmPointsLastWeek !== character.totalRealmPoints) {
        realmPointsLastWeek += character.realmPointsLastWeek;
      }
      if (character.killsLastWeek !== effectiveTotalKills) {
        killsLastWeek += character.killsLastWeek;
      }
      if (character.soloKillsLastWeek !== effectiveTotalSoloKills) {
        soloKillsLastWeek += character.soloKillsLastWeek;
      }
      if (character.deathsLastWeek !== effectiveTotalDeaths) {
        deathsLastWeek += character.deathsLastWeek;
      }
      if (character.deathBlowsLastWeek !== effectiveTotalDeathBlows) {
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
        character.heraldTotalKills !== null &&
        character.totalKills !== null
      ) {
        const hasMissingKillBaseline =
          character.totalKills === 0 &&
          character.heraldTotalKills > 0 &&
          character.killsLastWeek === 0;
        if (!hasMissingKillBaseline) {
          accumulatedKillsThisWeek +=
            character.heraldTotalKills - character.totalKills;
        }
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
    const killsThisWeek = Math.max(0, accumulatedKillsThisWeek);
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
      supporterTier: user.supporterTier ?? 0,
      championClasses,
      totalRealmPoints: totalPoints,
      totalKills,
      killsLastWeek,
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
      killsThisWeek,
      deathsThisWeek,
      soloKillsThisWeek,
      deathBlowsThisWeek,
      irsThisWeek,
    };
  });

  return aggregated.sort((a, b) => b.totalRealmPoints - a.totalRealmPoints);
};

export type FindUsersForLeaderboard = (
  where: Prisma.UserWhereInput
) => Promise<LeaderboardUserInput[]>;

const findUsersForLeaderboard: FindUsersForLeaderboard = (where) =>
  prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      clerkUserId: true,
      supporterTier: true,
      characters: {
        select: {
          character: {
            select: {
              id: true,
              totalRealmPoints: true,
              totalKills: true,
              totalSoloKills: true,
              totalDeaths: true,
              totalDeathBlows: true,
              killsLastWeek: true,
              deathsLastWeek: true,
              deathBlowsLastWeek: true,
              realmPointsLastWeek: true,
              soloKillsLastWeek: true,
              lastUpdated: true,
              heraldRealmPoints: true,
              heraldTotalKills: true,
              heraldTotalDeaths: true,
              heraldTotalSoloKills: true,
              heraldTotalDeathBlows: true,
              webId: true,
              heraldClassName: true,
              realm: true,
            },
          },
        },
      },
    },
  });

export type FindClassChampionWebIds = (webIds: string[]) => Promise<Set<string>>;

const findClassChampionWebIds: FindClassChampionWebIds = (webIds) =>
  getClassChampionWebIdsForCharacters(prisma, webIds);

export const getLeaderboardDataUncached = async (
  findUsers: FindUsersForLeaderboard = findUsersForLeaderboard,
  findChampionWebIds: FindClassChampionWebIds = findClassChampionWebIds
): Promise<LeaderboardItem[]> => {
  const users = await findUsers({ hideProfile: false });

  const webIds = users.flatMap((user) =>
    user.characters.map(({ character }) => character.webId)
  );
  const championWebIds = await findChampionWebIds(webIds).catch((error) => {
    console.error("Failed to fetch class champion webIds:", error);
    return new Set<string>();
  });

  return aggregateLeaderboardData(users, championWebIds);
};

const getCachedLeaderboardData = unstable_cache(
  () => getLeaderboardDataUncached(),
  ["leaderboard-data"],
  { revalidate: 60 }
);

export const getLeaderboardData = async (): Promise<LeaderboardItem[]> => {
  return getCachedLeaderboardData();
};
