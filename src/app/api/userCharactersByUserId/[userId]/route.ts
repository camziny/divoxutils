import { createUserCharactersByUserIdRouteHandlers } from "@/server/api/userCharactersByUserIdRouteHandlers";
import { getClassChampionWebIdsForCharacters } from "@/server/classChampionStore";
import { getUserCharactersByUserId } from "@/server/services/userCharacterService";
import prisma from "../../../../../prisma/prismaClient";

const handlers = createUserCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
    getClassChampionWebIds: (webIds) =>
      getClassChampionWebIdsForCharacters(prisma, webIds.map((webId) => ({ webId }))),
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
