import { createUserCharactersByUserIdRouteHandlers } from "@/server/userCharactersByUserIdRouteHandlers";
import { getUserCharactersByUserId } from "@/server/services/userCharacterService";

const handlers = createUserCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
