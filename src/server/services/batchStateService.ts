import { PrismaClient } from "@prisma/client";

async function getLastProcessedCharacterId(
  prisma: PrismaClient,
  key = "lastProcessedCharacterId"
): Promise<number> {
  const state = await prisma.batchState.findUnique({
    where: { key },
  });
  return state ? state.value : 0;
}

async function updateLastProcessedCharacterId(
  prisma: PrismaClient,
  lastId: number,
  key = "lastProcessedCharacterId"
): Promise<void> {
  await prisma.batchState.upsert({
    where: { key },
    update: { value: lastId },
    create: { key, value: lastId },
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

async function getLastProcessedRealmCharacterId(
  prisma: PrismaClient
): Promise<number> {
  const state = await prisma.batchState.findUnique({
    where: { key: "lastProcessedRealmCharacterId" },
  });
  return state ? state.value : 0;
}

async function updateLastProcessedRealmCharacterId(
  prisma: PrismaClient,
  lastId: number
): Promise<void> {
  await prisma.batchState.upsert({
    where: { key: "lastProcessedRealmCharacterId" },
    update: { value: lastId },
    create: { key: "lastProcessedRealmCharacterId", value: lastId },
  });
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
  getLastProcessedRealmCharacterId,
  updateLastProcessedRealmCharacterId,
  getLastProcessedHeraldCharacterId,
  updateLastProcessedHeraldCharacterId,
};
