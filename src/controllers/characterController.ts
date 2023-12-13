import prisma from "../../prisma/prismaClient";
import * as yup from "yup";
import axios from "axios";

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

export const addCharactersToUserList = async (
  webIds: string[],
  userId: number
) => {
  console.log(
    `addCharactersToUserList called with webIds: ${webIds} and userId: ${userId}`
  );
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
    const newWebIds = webIds.filter((webId) => !existingWebIds.includes(webId));

    await prisma.character.createMany({
      data: newWebIds.map((webId) => ({ webId })),
    });

    const freshlyCreatedCharacters = await prisma.character.findMany({
      where: {
        webId: {
          in: newWebIds,
        },
      },
    });

    const allCharacterIds = [
      ...existingCharacters,
      ...freshlyCreatedCharacters,
    ].map((char) => char.id);

    const userCharacterLinks = await prisma.userCharacter.findMany({
      where: {
        clerkUserId: user.clerkUserId,
        characterId: {
          in: allCharacterIds,
        },
      },
    });

    const linkedCharacterIds = userCharacterLinks.map(
      (link) => link.characterId
    );
    const charactersToLink = allCharacterIds.filter(
      (id) => !linkedCharacterIds.includes(id)
    );

    for (let characterId of charactersToLink) {
      await prisma.userCharacter.create({
        data: {
          clerkUserId: user.clerkUserId,
          characterId,
        },
      });
    }

    if (charactersToLink.length === 0) {
      console.log("No new characters to link for user:", userId);
    }

    return allCharacterIds;
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
