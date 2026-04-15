import * as characterController from "@/server/services/characterService";
import { createCharacterByIdRouteHandlers } from "@/server/api/characterByIdRouteHandlers";

const handlers = createCharacterByIdRouteHandlers({
  deps: {
    getCharacterById: characterController.getCharacterById,
    updateCharacter: characterController.updateCharacter,
    deleteCharacter: characterController.deleteCharacter,
  },
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
export const POST = handlers.POST;
