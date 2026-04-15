import prisma from "../../../../prisma/prismaClient";
import {
  getLastProcessedRealmCharacterId,
  updateLastProcessedRealmCharacterId,
} from "@/server/services/batchStateService";
import { createBatchedRealmUpdateRouteHandlers } from "@/server/api/batchedRealmUpdateRouteHandlers";

const handlers = createBatchedRealmUpdateRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  getLastProcessedCharacterId: () => getLastProcessedRealmCharacterId(prisma),
  updateLastProcessedCharacterId: (lastId: number) =>
    updateLastProcessedRealmCharacterId(prisma, lastId),
  findCharacters: ({ lastProcessedId, take }) =>
    prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
      },
      take,
      orderBy: { id: "asc" },
    }),
  updateCharacterRealm: ({ id, realm }) =>
    prisma.character.update({
      where: { id },
      data: { realm },
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
