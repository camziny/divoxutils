import prisma from "../../../../../../prisma/prismaClient";
import { getAllUserNames } from "@/server/services/userCharacterService";
import { createUsersStatsByNameRouteHandlers } from "@/server/usersStatsByNameRouteHandlers";

const handlers = createUsersStatsByNameRouteHandlers({
  apiSecret: process.env.DISCORD_BOT_API_KEY,
  deps: {
    getAllUserNames,
    getUserStatsByName: async (name: string) =>
      prisma.user.findUnique({
        where: {
          name,
        },
        select: {
          id: true,
          name: true,
          clerkUserId: true,
          characters: {
            select: {
              character: {
                select: {
                  totalRealmPoints: true,
                  totalSoloKills: true,
                  totalDeaths: true,
                  deathsLastWeek: true,
                  realmPointsLastWeek: true,
                  soloKillsLastWeek: true,
                  lastUpdated: true,
                },
              },
            },
          },
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
