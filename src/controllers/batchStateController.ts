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
async function getLastProcessedHeraldCharacterId(
  prisma: PrismaClient
): Promise<number> {
  const state = (await prisma.heraldBatchState.findUnique({
    where: { key: "lastProcessedCharacterId" },
  })) as { lastProcessedCharacterId: number } | null;
  return state ? state.lastProcessedCharacterId : 0;
}

async function updateLastProcessedHeraldCharacterId(
  prisma: PrismaClient,
  lastId: number
): Promise<void> {
  await prisma.heraldBatchState.upsert({
    where: { key: "lastProcessedCharacterId" },
    update: { lastProcessedCharacterId: lastId },
    create: {
      key: "lastProcessedCharacterId",
      lastProcessedCharacterId: lastId,
    },
  });
}

export {
  getLastProcessedCharacterId,
  updateLastProcessedCharacterId,
  getLastProcessedHeraldCharacterId,
  updateLastProcessedHeraldCharacterId,
};
