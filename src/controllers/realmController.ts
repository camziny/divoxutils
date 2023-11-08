import { PrismaClient, Prisma } from "@prisma/client";
import * as yup from "yup";

const prisma = new PrismaClient();

const realmSchema = yup.object().shape({
  name: yup.string().required(),
});

export const createRealm = async (data: any) => {
  try {
    await realmSchema.validate(data);
    return await prisma.realm.create({
      data,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const getRealms = async () => {
  return await prisma.realm.findMany({
    include: {
      characters: true,
    },
  });
};

export const getRealmById = async (id: number) => {
  return await prisma.realm.findUnique({
    where: { id },
    include: {
      characters: true,
    },
  });
};
