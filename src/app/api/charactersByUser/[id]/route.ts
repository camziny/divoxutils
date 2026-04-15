import { getUserCharactersByUserId } from "@/server/services/userCharacterService";
import { createCharactersByUserIdRouteHandlers } from "@/server/api/charactersByUserIdRouteHandlers";

const handlers = createCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
