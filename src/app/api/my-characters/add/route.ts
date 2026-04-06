import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import prisma from "../../../../../prisma/prismaClient";
import {
  createMyCharactersAddRouteHandlers,
  fetchCharacterDetailsFromHerald,
  mapCharacterData,
} from "@/server/api/myCharactersAddRouteHandlers";

const handlers = createMyCharactersAddRouteHandlers({
  getClerkUserId: async () => (await auth()).userId ?? null,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    }),
  fetchCharacterDetailsByWebId: fetchCharacterDetailsFromHerald,
  upsertCharacterFromDetails: (char) =>
    prisma.character.upsert({
      where: { webId: char.character_web_id },
      update: mapCharacterData(char),
      create: mapCharacterData(char),
    }),
  upsertUserCharacterLink: (clerkUserId, characterId) =>
    prisma.userCharacter.upsert({
      where: {
        clerkUserId_characterId: {
          clerkUserId,
          characterId,
        },
      },
      update: {},
      create: {
        clerkUserId,
        characterId,
      },
    }),
  revalidatePublicUserCharacters: () =>
    revalidateTag("public-user-characters"),
});

export const POST = handlers.POST;
