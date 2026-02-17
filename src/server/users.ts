import prisma from "../../prisma/prismaClient";

export type PublicUser = {
  id: number;
  clerkUserId: string;
  name: string;
};

export type GroupedUsers = Record<string, PublicUser[]>;

export const groupUsersByLetter = (users: PublicUser[]): GroupedUsers => {
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return sortedUsers.reduce((acc: GroupedUsers, user) => {
    if (!user.name) {
      return acc;
    }
    const firstLetter = user.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(user);
    return acc;
  }, {});
};

export const getPublicUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    where: {
      name: {
        not: null,
      },
    },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return users as PublicUser[];
};
