import { getUserCharactersByUserId } from "@/controllers/userCharacterController";
import { createCharactersByUserIdRouteHandlers } from "@/server/charactersByUserIdRouteHandlers";

const handlers = createCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
