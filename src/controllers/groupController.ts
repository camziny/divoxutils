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
  groupOwnerClerkUserId: string,
  memberClerkUserId: string
) => {
  const group = await prisma.group.findFirst({
    where: { groupOwner: groupOwnerClerkUserId },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  return await prisma.groupUser.create({
    data: {
      groupId: group.id,
      clerkUserId: memberClerkUserId,
      isInActiveGroup: false,
    },
  });
};

export const moveUserToActiveGroup = async (
  groupId: number,
  clerkUserId: string
) => {
  return await prisma.groupUser.update({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId,
      },
    },
    data: {
      isInActiveGroup: true,
    },
  });
};

export const removeUserFromGroup = async (
  groupId: number,
  clerkUserId: string
) => {
  await groupIdSchema.validate(groupId);

  try {
    const result = await prisma.groupUser.delete({
      where: {
        groupId_clerkUserId: {
          groupId,
          clerkUserId,
        },
      },
    });

    return result;
  } catch (error) {
    console.error("Failed to remove user from group:", error);
    throw new Error("Failed to remove user from group");
  }
};

export const getGroupByUser = async (clerkUserId: string) => {
  return await prisma.group.findFirst({
    where: {
      groupOwner: clerkUserId,
    },
  });
};

export const getUsersByGroup = async (groupId: number) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      groupUsers: {
        include: {
          user: true,
        },
      },
    },
  });
  return group;
};

export const saveGroupDetails = async (
  groupId: number,
  realm: string,
  publicStatus: boolean,
  activeUsers: Array<any>,
  rosterUsers: Array<any>
) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    await prisma.group.update({
      where: { id: groupId },
      data: { realm, public: publicStatus },
    });

    await prisma.groupUser.updateMany({
      where: { groupId },
      data: { isInActiveGroup: false },
    });

    for (const user of activeUsers) {
      await prisma.groupUser.upsert({
        where: {
          groupId_clerkUserId: {
            groupId,
            clerkUserId: user.clerkUserId,
          },
        },
        update: {
          isInActiveGroup: true,
          characterId: user.selectedCharacterId || null,
        },
        create: {
          groupId,
          clerkUserId: user.clerkUserId,
          isInActiveGroup: true,
          characterId: user.selectedCharacterId || null,
        },
      });
    }

    for (const user of rosterUsers) {
      await prisma.groupUser.upsert({
        where: {
          groupId_clerkUserId: {
            groupId,
            clerkUserId: user.clerkUserId,
          },
        },
        update: {
          isInActiveGroup: false,
          characterId: user.selectedCharacterId || null,
        },
        create: {
          groupId,
          clerkUserId: user.clerkUserId,
          isInActiveGroup: false,
          characterId: user.selectedCharacterId || null,
        },
      });
    }

    return { activeUsers, rosterUsers };
  });

  return transaction;
};

export const getUserGroupByName = async (name: string) => {
  return await prisma.group.findFirst({
    where: {
      name: name,
    },
    select: {
      id: true,
      public: true,
      name: true,
      groupOwner: true,
      realm: true,
    },
  });
};

export const createNewGroup = async (
  realm: string,
  name: string,
  publicStatus: boolean,
  groupOwner: string,
  activeUsers: Array<any>,
  rosterUsers: Array<any>
) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const group = await prisma.group.create({
      data: {
        name,
        realm,
        public: publicStatus,
        groupOwner,
      },
    });

    for (const user of activeUsers) {
      await prisma.groupUser.create({
        data: {
          groupId: group.id,
          clerkUserId: user.clerkUserId,
          isInActiveGroup: true,
          characterId: user.selectedCharacterId || null,
        },
      });
    }

    for (const user of rosterUsers) {
      await prisma.groupUser.create({
        data: {
          groupId: group.id,
          clerkUserId: user.clerkUserId,
          isInActiveGroup: false,
          characterId: user.selectedCharacterId || null,
        },
      });
    }

    return group;
  });

  return transaction;
};

export const deleteGroupById = async (groupId: number) => {
  try {
    const transaction = await prisma.$transaction(async (prisma) => {
      await prisma.groupUser.deleteMany({
        where: {
          groupId: groupId,
        },
      });

      const deletedGroup = await prisma.group.delete({
        where: {
          id: groupId,
        },
      });

      return deletedGroup;
    });

    console.log(
      `Group with ID ${groupId} and its associations have been deleted.`
    );
    return transaction;
  } catch (error) {
    console.error(`Error deleting group with ID ${groupId}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
