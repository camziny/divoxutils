import prisma from "../../../../prisma/prismaClient";
import { createUpdateLeaderboardStatsRouteHandlers } from "@/server/api/updateLeaderboardStatsRouteHandlers";

const handlers = createUpdateLeaderboardStatsRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  findCharacters: ({ skip, take }) =>
    prisma.character.findMany({
      skip,
      take,
      orderBy: { id: "asc" },
    }),
  updateCharacterByWebId: ({ webId, data }) =>
    prisma.character.update({
      where: { webId },
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
