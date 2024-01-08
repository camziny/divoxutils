import prisma from "../../prisma/prismaClient";
import * as yup from "yup";

const groupSchema = yup.object().shape({
  name: yup.string().required(),
  groupOwner: yup.string().required(),
});

const groupIdSchema = yup.number().positive().integer().required();

export const createGroup = async (name: string, groupOwner: string) => {
  await groupSchema.validate({ name, groupOwner });

  return await prisma.group.create({
    data: {
      name,
      groupOwner,
    },
  });
};

export const getGroups = async () => {
  return await prisma.group.findMany();
};

export const getGroupById = async (id: number) => {
  await groupIdSchema.validate(id);
  return await prisma.group.findUnique({ where: { id } });
};

export const updateGroup = async (id: number, data: any) => {
  await groupIdSchema.validate(id);
  await groupSchema.validate(data);
  return await prisma.group.update({ where: { id }, data });
};

export const deleteGroup = async (id: number) => {
  await groupIdSchema.validate(id);
  return await prisma.group.delete({ where: { id } });
};

export const addUserToGroup = async (
  groupId: number,
  clerkUserId: string,
  characterId: number
) => {
  await groupIdSchema.validate(groupId);

  return await prisma.groupUser.create({
    data: {
      groupId,
      clerkUserId,
      characterId,
    },
  });
};

export const removeUserFromGroup = async (
  groupId: number,
  clerkUserId: string
) => {
  await groupIdSchema.validate(groupId);

  return await prisma.groupUser.delete({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId,
      },
    },
  });
};

export const getGroupByUser = async (clerkUserId: string) => {
  const groupUser = await prisma.groupUser.findFirst({
    where: {
      clerkUserId: clerkUserId,
    },
    include: {
      group: true,
    },
  });

  return groupUser?.group;
};
