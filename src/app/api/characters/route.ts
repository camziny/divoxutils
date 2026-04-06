import { auth } from "@clerk/nextjs/server";
import * as characterController from "@/controllers/characterController";
import prisma from "../../../../prisma/prismaClient";
import { createCharactersCollectionRouteHandlers } from "@/server/api/charactersCollectionRouteHandlers";

const handlers = createCharactersCollectionRouteHandlers({
  getClerkUserId: async () => (await auth()).userId ?? null,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
    }),
  findUserById: (id) =>
    prisma.user.findUnique({
      where: { id },
    }),
  getCharacters: () => characterController.getCharacters(),
  addCharactersToUserList: (characters, userId) =>
    characterController.addCharactersToUserList(
      characters as string[],
      userId
    ),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
