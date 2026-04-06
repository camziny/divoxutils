import * as characterController from "@/controllers/characterController";
import { createCharacterByIdRouteHandlers } from "@/server/characterByIdRouteHandlers";

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
