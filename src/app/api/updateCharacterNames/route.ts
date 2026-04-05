import prisma from "../../../../prisma/prismaClient";
import { createUpdateCharacterNamesRouteHandlers } from "@/server/api/updateCharacterNamesRouteHandlers";

const handlers = createUpdateCharacterNamesRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  countUnknownCharacters: () =>
    prisma.character.count({
      where: {
        OR: [{ characterName: "Unknown" }, { className: "Unknown" }],
      },
    }),
  findCharacters: ({ lastProcessedId, take, before }) =>
    prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
        nameLastUpdated: {
          lt: before,
        },
        OR: [{ characterName: "Unknown" }, { className: "Unknown" }],
      },
      select: {
        id: true,
        webId: true,
        characterName: true,
        className: true,
        nameLastUpdated: true,
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
