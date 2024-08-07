import { PrismaClient, Prisma } from "@prisma/client";
import * as yup from "yup";
import bcrypt from "bcrypt";
import prisma from "../../prisma/prismaClient";

const accountSchema = yup
  .object()
  .shape({
    email: yup.string().email().required(),
    password: yup.string().required(),
  })
  .unknown(true);

const userSchema = yup
  .object()
  .shape({
    email: yup.string().email().required(),
    name: yup.string().optional(),
  })
  .unknown(true);

type ClerkUserData = {
  email: string;
  username: string;
  clerkUserId: string;
};

const clerkUserIdSchema = yup.string().required();

type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export const loginUser = async (data: any) => {
  const email = data["email"];
  const account = await prisma.account.findUnique({
    where: {
      providerAccountId: email,
      providerType: "local",
    },
  });
  if (!account) {
    throw new Error("No account found with this email address.");
  }
  const isValidPassword = await bcrypt.compare(
    data.password,
    account.password || ""
  );

  if (!isValidPassword) {
    throw new Error("Invalid password.");
  }

  return account;
};

const idSchema = yup.number().positive().integer().required();

export const getUserById = async (id: number) => {
  try {
    await idSchema.validate(id);

    return await prisma.user.findUnique({
      where: { id },
      include: {
        account: true,
        characters: true,
      },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const getUsers = async () => {
  return await prisma.user.findMany({
    include: {
      account: true,
    },
  });
};

export const updateUser = async (id: number, data: any) => {
  try {
    await idSchema.validate(id);
    await userSchema.validate(data);

    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("This email is already in use.");
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const deleteUser = async (id: number) => {
  try {
    await idSchema.validate(id);

    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const getUserByName = async (name: string) => {
  return await prisma.user.findMany({
    where: { name },
    include: {
      account: true,
    },
  });
};

export const createUserFromClerk = async (data: any) => {
  try {
    await userSchema.validate(data);

    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: data.clerkUserId },
    });

    if (existingUser) {
      return existingUser;
    }
    const name = data.username || "Default Name";

    const createdUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        clerkUserId: data.clerkUserId,
      },
    });
    return createdUser;
  } catch (error: any) {
    console.error(
      "Error in createUserFromClerk:",
      JSON.stringify({
        errorMessage: error.message,
        errorStack: error.stack,
        errorDetails: error,
      })
    );

    if (error instanceof yup.ValidationError) {
      console.error("Validation error:", error);
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.error("Unique constraint violation:", error);
    } else {
      console.error("Prisma client error:", error);
    }
    throw error;
  }
};

export const getUserByClerkUserId = async (clerkUserId: string) => {
  try {
    await clerkUserIdSchema.validate(clerkUserId);

    return await prisma.user.findUnique({
      where: { clerkUserId: clerkUserId },
      include: {
        characters: true,
      },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const updateUserFromClerk = async (clerkUserId: string, data: any) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data,
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      console.error(`Validation error: ${error.message}`, error);
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.error("This email is already in use.", error);
    } else {
      console.error(
        "An unexpected error occurred in updateUserFromClerk:",
        error
      );
    }
    throw error;
  }
};

export const getUsersByPartialName = async (name: string) => {
  return await prisma.user.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    include: {
      account: true,
    },
  });
};

export const getUserByCharacterName = async (characterName: string) => {
  return await prisma.user.findMany({
    where: {
      characters: {
        some: {
          character: {
            characterName: {
              startsWith: characterName,
              mode: "insensitive",
            },
          },
        },
      },
    },
    include: {
      account: true,
      characters: {
        include: {
          character: true,
        },
      },
    },
  });
};

export const deleteUserByClerkUserId = async (clerkUserId: string) => {
  try {
    await clerkUserIdSchema.validate(clerkUserId);

    return await prisma.user.delete({
      where: { clerkUserId },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};
