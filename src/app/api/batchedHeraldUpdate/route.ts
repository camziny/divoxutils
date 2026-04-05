import prisma from "../../../../prisma/prismaClient";
import {
  getLastProcessedHeraldCharacterId,
  updateLastProcessedHeraldCharacterId,
} from "@/controllers/batchStateController";
import { createBatchedHeraldUpdateRouteHandlers } from "@/server/api/batchedHeraldUpdateRouteHandlers";

const handlers = createBatchedHeraldUpdateRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  getLastProcessedHeraldCharacterId: () =>
    getLastProcessedHeraldCharacterId(prisma),
  updateLastProcessedHeraldCharacterId: (lastId: number) =>
    updateLastProcessedHeraldCharacterId(prisma, lastId),
  findCharacters: ({ lastProcessedId, take }) =>
    prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
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
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
