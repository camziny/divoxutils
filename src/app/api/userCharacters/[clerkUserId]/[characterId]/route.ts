import { auth } from "@clerk/nextjs/server";
import { createUserCharacterRouteHandlers } from "@/server/userCharacterRouteHandlers";
import {
  deleteUserCharacter,
  getUserCharacterById,
} from "@/controllers/userCharacterController";

const handlers = createUserCharacterRouteHandlers({
  getAuthUserId: async () => {
    const { userId } = await auth();
    return userId;
  },
  deps: {
    getUserCharacterById,
    deleteUserCharacter,
  },
});

export const GET = handlers.GET;
export const DELETE = handlers.DELETE;
