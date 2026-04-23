import prisma from "../../../../prisma/prismaClient";
import { createResetLastWeekStatsRouteHandlers } from "@/server/api/resetLastWeekStatsRouteHandlers";

const handlers = createResetLastWeekStatsRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  findCharactersToReset: ({ lastProcessedId, take }) =>
    prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
        OR: [
          { realmPointsLastWeek: { not: 0 } },
          { killsLastWeek: { not: 0 } },
          { soloKillsLastWeek: { not: 0 } },
          { deathsLastWeek: { not: 0 } },
          { deathBlowsLastWeek: { not: 0 } },
        ],
      },
      take,
      orderBy: { id: "asc" },
    }),
  resetCharactersByIds: (ids: number[]) =>
    prisma.character
      .updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          realmPointsLastWeek: 0,
          killsLastWeek: 0,
          soloKillsLastWeek: 0,
          deathsLastWeek: 0,
          deathBlowsLastWeek: 0,
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
