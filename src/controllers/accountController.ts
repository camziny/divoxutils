import prisma from "../../prisma/prismaClient";
import * as yup from "yup";

const accountSchema = yup.object().shape({
  userId: yup
    .string()
    .required("A userId must be provided to create an account."),
  providerType: yup.string().required(),
  providerId: yup.string().required(),
  providerAccountId: yup.string().required(),
  refreshToken: yup.string().nullable(),
  accessToken: yup.string().nullable(),
  accessTokenExpires: yup.date().nullable(),
});

const idSchema = yup.number().positive().integer().required();

export const createAccount = async (data: any) => {
  try {
    await accountSchema.validate(data);

    return await prisma.account.create({
      data,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const getAccounts = async () => {
  return await prisma.account.findMany({
    include: { user: true },
  });
};

export const getAccountById = async (id: number) => {
  try {
    await idSchema.validate(id);

    return await prisma.account.findUnique({
      where: { id },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const deleteAccount = async (id: number) => {
  try {
    await idSchema.validate(id);

    return await prisma.account.delete({ where: { id } });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const updateAccount = async (id: number, data: any) => {
  try {
    await idSchema.validate(id);

    if (data.userId) {
      throw new Error("You cannot change the userId of an existing account.");
    }

    return await prisma.account.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};
