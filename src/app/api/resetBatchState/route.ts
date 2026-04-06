import prisma from "../../../../prisma/prismaClient";
import { createResetBatchStateRouteHandlers } from "@/server/api/resetBatchStateRouteHandlers";

const handlers = createResetBatchStateRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  resetBatchState: async () => {
    await prisma.$transaction([
      prisma.batchState.upsert({
        where: { key: "lastProcessedCharacterId" },
        update: { value: 0 },
        create: { key: "lastProcessedCharacterId", value: 0 },
      }),
      prisma.batchState.upsert({
        where: { key: "lastProcessedRealmCharacterId" },
        update: { value: 0 },
        create: { key: "lastProcessedRealmCharacterId", value: 0 },
      }),
    ]);
  },
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
