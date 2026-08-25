import { getUserCharactersByUserId } from "@/server/services/userCharacterService";
import { createCharactersByUserIdRouteHandlers } from "@/server/api/charactersByUserIdRouteHandlers";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { getClerkAuthUserId } from "@/server/clerkAuth";

const handlers = createCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
  getAuthUserId: getClerkAuthUserId,
  isAdminClerkUserId,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
