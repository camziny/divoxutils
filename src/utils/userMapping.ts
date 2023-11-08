import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
