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
  console.log("Attempting to create UserCharacter with data:", data);
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
  console.log("Getting UserCharacters for clerkUserId:", clerkUserId);
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
  console.log("Fetching UserCharacter by ID:", ids);
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
  console.log("Inside deleteUserCharacter function with IDs:", ids);

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

    console.log("Successfully deleted UserCharacter, result:", result);
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
  console.log("Getting UserCharacters by UserId:", clerkUserId);
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
