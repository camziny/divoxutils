import { PrismaClient } from "@prisma/client";

async function getLastProcessedCharacterId(
  prisma: PrismaClient
): Promise<number> {
  const state = await prisma.batchState.findUnique({
    where: { key: "lastProcessedCharacterId" },
  });
  return state ? state.value : 0;
}

async function updateLastProcessedCharacterId(
  prisma: PrismaClient,
  lastId: number
): Promise<void> {
  await prisma.batchState.upsert({
    where: { key: "lastProcessedCharacterId" },
    update: { value: lastId },
    create: { key: "lastProcessedCharacterId", value: lastId },
  });
}

export { getLastProcessedCharacterId, updateLastProcessedCharacterId };
