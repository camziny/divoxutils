import { createUserCharactersByUserIdRouteHandlers } from "@/server/api/userCharactersByUserIdRouteHandlers";
import { getClassChampionWebIdsForCharacters } from "@/server/classChampionStore";
import { getUserCharactersByUserId } from "@/server/services/userCharacterService";
import prisma from "../../../../../prisma/prismaClient";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { getClerkAuthUserId } from "@/server/clerkAuth";

const handlers = createUserCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
    getClassChampionWebIds: (webIds) =>
      getClassChampionWebIdsForCharacters(prisma, webIds),
  },
  getAuthUserId: getClerkAuthUserId,
  isAdminClerkUserId,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
