import prisma from "../../prisma/prismaClient";
import * as yup from "yup";
import axios from "axios";
import { NewCharacterData } from "@/utils/character";

const characterSchema = yup.object().shape({
  name: yup.string().required(),
  serverName: yup.string().required(),
  level: yup.number().positive().integer().required(),
  realmPoints: yup.number().positive().integer().required(),
  realmRank: yup.number().positive().integer().required(),
  guildName: yup.string().nullable(),
  webId: yup.string().required(),
  realmId: yup.number().positive().integer().nullable(),
});

const idSchema = yup.number().positive().integer().required();

export const fetchCharacterDetails = async (name: string, cluster: string) => {
  try {
    const response = await axios.get(
      "https://api.camelotherald.com/character/search",
      {
        params: {
          name: name,
          cluster: cluster,
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(
        `Error fetching character details. Status code: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error fetching character details:", error);
    throw error;
  }
};

export const realmMapping: { [key: number]: string } = {
  1: "Albion",
  2: "Midgard",
  3: "Hibernia",
};

export const addCharactersToUserList = async (
  webIds: string[],
  userId: number,
  newCharacterData: NewCharacterData[] = []
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const existingCharacters = await prisma.character.findMany({
      where: {
        webId: {
          in: webIds,
        },
      },
    });

    const existingWebIds = existingCharacters.map((char) => char.webId);
    const newCharacterDetails = newCharacterData
      .filter((char) => !existingWebIds.includes(char.webId))
      .map((character) => ({
        ...character,
        realm: realmMapping[character.realm as number] || "Unknown",
      }));

    for (const character of newCharacterDetails) {
      await prisma.character.upsert({
        where: { webId: character.webId },
        update: {
          characterName: character.characterName,
          className: character.className,
          realm: character.realm,
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
          heraldTotalKills: character.heraldTotalKills,
          heraldTotalDeaths: character.heraldTotalDeaths,
          heraldTotalDeathBlows: character.heraldTotalDeathBlows,
          heraldTotalSoloKills: character.heraldTotalSoloKills,
          heraldMidgardKills: character.heraldMidgardKills,
          heraldMidgardDeaths: character.heraldMidgardDeaths,
          heraldMidgardDeathBlows: character.heraldMidgardDeathBlows,
          heraldMidgardSoloKills: character.heraldMidgardSoloKills,
          heraldAlbionKills: character.heraldAlbionKills,
          heraldAlbionDeaths: character.heraldAlbionDeaths,
          heraldAlbionDeathBlows: character.heraldAlbionDeathBlows,
          heraldAlbionSoloKills: character.heraldAlbionSoloKills,
          heraldHiberniaKills: character.heraldHiberniaKills,
          heraldHiberniaDeaths: character.heraldHiberniaDeaths,
          heraldHiberniaDeathBlows: character.heraldHiberniaDeathBlows,
          heraldHiberniaSoloKills: character.heraldHiberniaSoloKills,
          heraldMasterLevel: character.heraldMasterLevel,
        },
        create: character,
      });
    }

    const allCharacterIds = await prisma.character.findMany({
      where: {
        webId: {
          in: webIds,
        },
      },
    });

    for (let character of allCharacterIds) {
      const linkExists = await prisma.userCharacter.findUnique({
        where: {
          clerkUserId_characterId: {
            clerkUserId: user.clerkUserId,
            characterId: character.id,
          },
        },
      });

      if (!linkExists) {
        await prisma.userCharacter.create({
          data: {
            clerkUserId: user.clerkUserId,
            characterId: character.id,
          },
        });
      }
    }

    return allCharacterIds.map((char) => char.id);
  } catch (error) {
    console.error(
      `Error adding characters to user list for userId ${userId}:`,
      error
    );
    throw error;
  }
};

export const getCharacters = async () => {
  return await prisma.character.findMany();
};

export const getCharacterById = async (id: number) => {
  await idSchema.validate(id);
  return await prisma.character.findUnique({ where: { id } });
};

export const updateCharacter = async (id: number, data: any) => {
  await idSchema.validate(id);
  await characterSchema.validate(data);
  return await prisma.character.update({ where: { id }, data });
};

export const deleteCharacter = async (id: number) => {
  await idSchema.validate(id);
  return await prisma.character.delete({ where: { id } });
};
