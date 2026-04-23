import { unstable_cache } from "next/cache";
import prisma from "../../prisma/prismaClient";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";

type PublicUserProfile = {
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
};

type UserCharacterRecord = {
  character: any | null;
};

const getPublicUserProfileByNameUncached = async (
  name: string
): Promise<PublicUserProfile | null> => {
  return prisma.user.findFirst({
    where: { name },
    select: {
      clerkUserId: true,
      name: true,
      supporterTier: true,
    },
  });
};

const getPublicUserProfileByNameCached = unstable_cache(
  getPublicUserProfileByNameUncached,
  ["public-user-profile-by-name"],
  { revalidate: 300, tags: ["public-user-profile"] }
);

export const getPublicUserProfileByName = async (
  name: string
): Promise<PublicUserProfile | null> => {
  if (!name) return null;
  return getPublicUserProfileByNameCached(name);
};

const getPublicCharactersForUserUncached = async (clerkUserId: string) => {
  const userCharacters = await prisma.userCharacter.findMany({
    where: { clerkUserId },
    include: { character: true },
  });

  return mapUserCharactersToPublicPayload(userCharacters, clerkUserId);
};

const getPublicCharactersForUserCached = unstable_cache(
  getPublicCharactersForUserUncached,
  ["public-user-characters-by-clerk-id"],
  { revalidate: 300, tags: ["public-user-characters"] }
);

export const mapUserCharactersToPublicPayload = (
  userCharacters: UserCharacterRecord[],
  clerkUserId: string
): Exclude<ReturnType<typeof mapUserCharacterToPublicPayload>, null>[] =>
  userCharacters
    .map((userCharacter) =>
      mapUserCharacterToPublicPayload(userCharacter, clerkUserId)
    )
    .filter(
      (
        character
      ): character is Exclude<
        ReturnType<typeof mapUserCharacterToPublicPayload>,
        null
      > => character !== null
    );

const mapUserCharacterToPublicPayload = (
  userCharacter: UserCharacterRecord,
  clerkUserId: string
) => {
  if (!userCharacter.character) {
    return null;
  }

  const { character } = userCharacter;
  const heraldRealmPoints = character.heraldRealmPoints ?? 0;
  const formattedHeraldRealmPoints = formatRealmRankWithLevel(
    getRealmRankForPoints(heraldRealmPoints)
  );

  return {
    id: character.id,
    webId: character.webId,
    characterName: character.characterName,
    className: character.className,
    realm: character.realm,
    previousCharacterName: character.previousCharacterName,
    totalRealmPoints: character.totalRealmPoints,
    realmPointsLastWeek: character.realmPointsLastWeek,
    totalSoloKills: character.totalSoloKills,
    soloKillsLastWeek: character.soloKillsLastWeek,
    totalDeaths: character.totalDeaths,
    deathsLastWeek: character.deathsLastWeek,
    lastUpdated: character.lastUpdated,
    nameLastUpdated: character.nameLastUpdated,
    heraldCharacterWebId: character.heraldCharacterWebId,
    heraldName: character.heraldName,
    heraldServerName: character.heraldServerName,
    heraldRealm: character.heraldRealm,
    heraldRace: character.heraldRace,
    heraldClassName: character.heraldClassName,
    heraldLevel: character.heraldLevel,
    heraldGuildName: character.heraldGuildName,
    heraldRealmPoints: character.heraldRealmPoints,
    heraldBountyPoints: character.heraldBountyPoints,
    heraldMasterLevel: character.heraldMasterLevel,
    heraldTotalKills: character.heraldTotalKills,
    heraldTotalDeaths: character.heraldTotalDeaths,
    heraldTotalDeathBlows: character.heraldTotalDeathBlows,
    heraldTotalSoloKills: character.heraldTotalSoloKills,
    heraldAlbionKills: character.heraldAlbionKills,
    heraldAlbionDeaths: character.heraldAlbionDeaths,
    heraldAlbionDeathBlows: character.heraldAlbionDeathBlows,
    heraldAlbionSoloKills: character.heraldAlbionSoloKills,
    heraldMidgardKills: character.heraldMidgardKills,
    heraldMidgardDeaths: character.heraldMidgardDeaths,
    heraldMidgardDeathBlows: character.heraldMidgardDeathBlows,
    heraldMidgardSoloKills: character.heraldMidgardSoloKills,
    heraldHiberniaKills: character.heraldHiberniaKills,
    heraldHiberniaDeaths: character.heraldHiberniaDeaths,
    heraldHiberniaDeathBlows: character.heraldHiberniaDeathBlows,
    heraldHiberniaSoloKills: character.heraldHiberniaSoloKills,
    clerkUserId,
    formattedHeraldRealmPoints,
    initialCharacter: {
      id: character.id,
      userId: clerkUserId,
      webId: character.webId,
    },
    player_kills: {
      total: {
        kills: character.heraldTotalKills || 0,
        deaths: character.heraldTotalDeaths || 0,
        death_blows: character.heraldTotalDeathBlows || 0,
        solo_kills: character.heraldTotalSoloKills || 0,
      },
      midgard: {
        kills: character.heraldMidgardKills || 0,
        deaths: character.heraldMidgardDeaths || 0,
        death_blows: character.heraldMidgardDeathBlows || 0,
        solo_kills: character.heraldMidgardSoloKills || 0,
      },
      albion: {
        kills: character.heraldAlbionKills || 0,
        deaths: character.heraldAlbionDeaths || 0,
        death_blows: character.heraldAlbionDeathBlows || 0,
        solo_kills: character.heraldAlbionSoloKills || 0,
      },
      hibernia: {
        kills: character.heraldHiberniaKills || 0,
        deaths: character.heraldHiberniaDeaths || 0,
        death_blows: character.heraldHiberniaDeathBlows || 0,
        solo_kills: character.heraldHiberniaSoloKills || 0,
      },
    },
  };
};

export const getPublicCharactersForUser = async (clerkUserId: string) => {
  if (!clerkUserId) return [];
  return getPublicCharactersForUserCached(clerkUserId);
};
