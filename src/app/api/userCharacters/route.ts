import { auth } from "@clerk/nextjs/server";
import * as userCharacterController from "@/server/services/userCharacterService";
import { createUserCharactersRouteHandlers } from "@/server/userCharactersRouteHandlers";

const handlers = createUserCharactersRouteHandlers({
  deps: {
    getAuthUserId: async () => (await auth()).userId ?? null,
    getUserCharacters: userCharacterController.getUserCharacters,
    createUserCharacter: userCharacterController.createUserCharacter,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
