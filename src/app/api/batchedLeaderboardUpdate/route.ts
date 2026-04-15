import prisma from "../../../../prisma/prismaClient";
import {
  getLastProcessedCharacterId,
  updateLastProcessedCharacterId,
} from "@/server/services/batchStateService";
import { createBatchedLeaderboardUpdateRouteHandlers } from "@/server/api/batchedLeaderboardUpdateRouteHandlers";

const handlers = createBatchedLeaderboardUpdateRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  getLastProcessedCharacterId: () => getLastProcessedCharacterId(prisma),
  updateLastProcessedCharacterId: (lastId: number) =>
    updateLastProcessedCharacterId(prisma, lastId),
  findCharacters: ({ lastProcessedId, take, lastUpdatedLte }) =>
    prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
        lastUpdated: { lte: lastUpdatedLte },
      },
      take,
      orderBy: { id: "asc" },
    }),
  updateCharacter: ({ id, data }) =>
    prisma.character.update({
      where: { id },
      data,
    }).then(() => undefined),
  fetchImpl: fetch,
  now: () => new Date(),
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
