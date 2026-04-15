import { auth } from "@clerk/nextjs/server";
import { createUserCharacterRouteHandlers } from "@/server/api/userCharacterRouteHandlers";
import {
  deleteUserCharacter,
  getUserCharacterById,
} from "@/server/services/userCharacterService";

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
