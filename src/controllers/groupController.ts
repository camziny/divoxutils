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
  memberClerkUserId: string
) => {
  console.log(
    `Received request to add user ${memberClerkUserId} to group ${groupId}`
  );

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const existingMember = await prisma.groupUser.findFirst({
    where: {
      groupId: groupId,
      clerkUserId: memberClerkUserId,
    },
  });

  if (existingMember) {
    console.log(
      `User ${memberClerkUserId} is already a member of group ${groupId}`
    );
    throw new Error("User is already a member of this group");
  } else {
    console.log(
      `User ${memberClerkUserId} is not in group ${groupId}, proceeding to add`
    );
  }

  const addedUser = await prisma.groupUser.create({
    data: {
      groupId: groupId,
      clerkUserId: memberClerkUserId,
      isInActiveGroup: false,
    },
  });
  console.log(`Added user ${memberClerkUserId} to group ${groupId}`);
  return addedUser;
};

export const moveUserToActiveGroup = async (
  groupId: number,
  clerkUserId: string
) => {
  const groupUser = await prisma.groupUser.findFirst({
    where: {
      groupId: groupId,
      clerkUserId: clerkUserId,
    },
  });

  if (!groupUser) {
    throw new Error("GroupUser record not found");
  }

  return await prisma.groupUser.update({
    where: {
      id: groupUser.id,
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
    const groupUser = await prisma.groupUser.findFirst({
      where: {
        groupId: groupId,
        clerkUserId: clerkUserId,
      },
    });

    if (!groupUser) {
      throw new Error("GroupUser record not found");
    }
    return await prisma.groupUser.delete({
      where: {
        id: groupUser.id,
      },
    });
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

type User = {
  clerkUserId: string;
  selectedCharacterId?: number;
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

    const processUsers = async (users: User[], isActive: boolean) => {
      for (const user of users) {
        const groupUser = await prisma.groupUser.findFirst({
          where: {
            groupId: groupId,
            clerkUserId: user.clerkUserId,
          },
        });

        if (groupUser) {
          await prisma.groupUser.update({
            where: { id: groupUser.id },
            data: {
              isInActiveGroup: isActive,
              characterId: user.selectedCharacterId || null,
            },
          });
        } else {
          await prisma.groupUser.create({
            data: {
              groupId,
              clerkUserId: user.clerkUserId,
              isInActiveGroup: isActive,
              characterId: user.selectedCharacterId || null,
            },
          });
        }
      }
    };

    await processUsers(activeUsers, true);

    await processUsers(rosterUsers, false);

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
