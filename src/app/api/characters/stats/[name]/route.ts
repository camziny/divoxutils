import prisma from "../../../../../../prisma/prismaClient";
import { createCharacterStatsByNameRouteHandlers } from "@/server/characterStatsByNameRouteHandlers";

const handlers = createCharacterStatsByNameRouteHandlers({
  apiSecret: process.env.DISCORD_BOT_API_KEY,
  deps: {
    getCharacterStatsByName: async (name: string) =>
      prisma.character.findFirst({
        where: {
          characterName: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          characterName: true,
          className: true,
          realm: true,
          totalRealmPoints: true,
          totalSoloKills: true,
          totalDeaths: true,
          deathsLastWeek: true,
          realmPointsLastWeek: true,
          soloKillsLastWeek: true,
          lastUpdated: true,
        },
      }),
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
