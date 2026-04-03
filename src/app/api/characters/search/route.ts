import { fetchCharacterDetails } from "@/controllers/characterController";
import { createCharactersSearchRouteHandlers } from "@/server/charactersSearchRouteHandlers";

const handlers = createCharactersSearchRouteHandlers({
  deps: {
    fetchCharacterDetails,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
