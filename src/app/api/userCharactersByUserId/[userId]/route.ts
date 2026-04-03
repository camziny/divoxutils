import { createUserCharactersByUserIdRouteHandlers } from "@/server/userCharactersByUserIdRouteHandlers";
import { getUserCharactersByUserId } from "@/controllers/userCharacterController";

const handlers = createUserCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
