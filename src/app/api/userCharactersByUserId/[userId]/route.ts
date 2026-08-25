import { createUserCharactersByUserIdRouteHandlers } from "@/server/api/userCharactersByUserIdRouteHandlers";
import { getUserCharactersByUserId } from "@/server/services/userCharacterService";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { getClerkAuthUserId } from "@/server/clerkAuth";

const handlers = createUserCharactersByUserIdRouteHandlers({
  deps: {
    getUserCharactersByUserId,
  },
  getAuthUserId: getClerkAuthUserId,
  isAdminClerkUserId,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
