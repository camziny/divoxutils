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

    const createdUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        clerkUserId: data.clerkUserId,
      },
    });
    return createdUser;
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
        "An unexpected error occurred in createUserFromClerk:",
        error
      );
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

export const updateUserFromClerk = async (clerkUserId: string, data: any) => {
  try {
    console.log("Updating user with ID:", clerkUserId, "Data:", data);
    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data,
    });
    console.log("Updated User:", updatedUser);

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
