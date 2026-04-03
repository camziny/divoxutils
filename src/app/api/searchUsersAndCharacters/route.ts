import prisma from "../../../../prisma/prismaClient";
import { createSearchUsersAndCharactersRouteHandlers } from "@/server/searchUsersAndCharactersRouteHandlers";

const handlers = createSearchUsersAndCharactersRouteHandlers({
  deps: {
    findUsers: ({ normalizedQuery }) =>
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            {
              characters: {
                some: {
                  character: {
                    heraldName: {
                      contains: normalizedQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          characters: {
            where: {
              character: {
                heraldName: {
                  contains: normalizedQuery,
                  mode: "insensitive",
                },
              },
            },
            include: {
              character: true,
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
