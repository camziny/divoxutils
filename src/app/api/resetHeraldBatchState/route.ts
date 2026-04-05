import prisma from "../../../../prisma/prismaClient";
import { createResetHeraldBatchStateRouteHandlers } from "@/server/api/resetHeraldBatchStateRouteHandlers";

const handlers = createResetHeraldBatchStateRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  resetHeraldBatchState: () =>
    prisma.heraldBatchState
      .upsert({
        where: { key: "lastProcessedCharacterId" },
        update: { lastProcessedCharacterId: 0 },
        create: {
          key: "lastProcessedCharacterId",
          lastProcessedCharacterId: 0,
        },
      })
      .then(() => undefined),
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
