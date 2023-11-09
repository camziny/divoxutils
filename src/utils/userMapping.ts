import prisma from "../../prisma/prismaClient";

export async function getDbUserIdFromClerkUserId(
  clerkUserId: string
): Promise<number | null> {
  const user = await prisma.user.findFirst({
    where: {
      clerkUserId: clerkUserId,
    },
    select: {
      id: true,
    },
  });

  return user?.id || null;
}
