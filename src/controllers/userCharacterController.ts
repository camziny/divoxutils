import prisma from "../../prisma/prismaClient";
import * as yup from "yup";

const userCharacterSchema = yup.object().shape({
  clerkUserId: yup.string().required(),
  characterId: yup.string().required(),
});

const idSchema = yup.object().shape({
  clerkUserId: yup.string().required(),
  characterId: yup.number().positive().integer().required(),
});

export const createUserCharacter = async (data: any) => {
  try {
    await userCharacterSchema.validate(data);
    return await prisma.userCharacter.create({ data });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const getUserCharacters = async (clerkUserId?: string) => {
  if (clerkUserId) {
    return await prisma.userCharacter.findMany({
      where: {
        clerkUserId: clerkUserId,
      },
      include: {
        character: true,
      },
    });
  } else {
    return await prisma.userCharacter.findMany({
      include: {
        character: true,
      },
    });
  }
};

export const getUserCharacterById = async (ids: {
  clerkUserId: string;
  characterId: number;
}) => {
  await idSchema.validate(ids);
  return await prisma.userCharacter.findUnique({
    where: {
      clerkUserId_characterId: {
        clerkUserId: ids.clerkUserId,
        characterId: ids.characterId,
      },
    },
  });
};

export const updateUserCharacter = async (
  ids: { clerkUserId: string; characterId: number },
  data: any
) => {
  await idSchema.validate(ids);
  await userCharacterSchema.validate(data);
  return await prisma.userCharacter.update({
    where: {
      clerkUserId_characterId: {
        clerkUserId: ids.clerkUserId,
        characterId: ids.characterId,
      },
    },
    data,
  });
};

export const deleteUserCharacter = async (ids: {
  clerkUserId: string;
  characterId: number;
}) => {
  try {
    await idSchema.validate(ids);
    const result = await prisma.userCharacter.delete({
      where: {
        clerkUserId_characterId: {
          clerkUserId: ids.clerkUserId,
          characterId: ids.characterId,
        },
      },
    });
    return result;
  } catch (error) {
    console.error("Caught error during deleteUserCharacter function:", error);
    throw error;
  }
};

export const getUserCharactersByClerkUserId = async (clerkUserId: string) => {
  return await prisma.userCharacter.findMany({
    where: {
      clerkUserId: clerkUserId,
    },
    include: {
      character: true,
    },
  });
};

export const getUserCharactersByUserId = async (clerkUserId: string) => {
  try {
    const userCharacters = await prisma.userCharacter.findMany({
      where: {
        clerkUserId: clerkUserId,
      },
      include: {
        user: true,
        character: true,
      },
    });

    return userCharacters;
  } catch (error) {
    console.error("Error fetching characters by user ID:", error);
    throw error;
  }
};

export const deleteUserCharacterByWebId = async (
  clerkUserId: string,
  webId: string
) => {
  try {
    const userCharacter = await prisma.userCharacter.findFirst({
      where: {
        clerkUserId: clerkUserId,
        character: {
          webId: webId,
        },
      },
      include: {
        character: true,
      },
    });

    if (!userCharacter) {
      console.log(
        `Character with webId ${webId} not found for user ${clerkUserId}.`
      );
      return null;
    }

    await prisma.character.delete({
      where: { id: userCharacter.character.id },
    });

    console.log(
      `Character with webId ${webId} deleted for user ${clerkUserId}.`
    );
  } catch (error) {
    console.error("Error deleting character by webId:", error);
    throw error;
  }
};

export async function getUserCharactersByUserName(userName: string) {
  const user = await prisma.user.findUnique({
    where: { name: userName },
    include: {
      characters: {
        select: {
          character: {
            select: {
              characterName: true,
              className: true,
              totalRealmPoints: true,
              realm: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.characters.map((uc) => uc.character);
}

export async function getAllUserNames(): Promise<string[]> {
  const users = await prisma.user.findMany({
    select: {
      name: true,
    },
  });

  return users
    .map((user) => user.name)
    .filter((name): name is string => name !== null);
}
