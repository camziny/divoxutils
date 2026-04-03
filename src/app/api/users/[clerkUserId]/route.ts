import * as userController from "@/controllers/userController";
import { clerkClient } from "@clerk/nextjs/server";
import { createUserByClerkIdRouteHandlers } from "@/server/userByClerkIdRouteHandlers";

const handlers = createUserByClerkIdRouteHandlers({
  deps: {
    getUserByClerkUserId: userController.getUserByClerkUserId,
    getClerkUsername: async (clerkUserId: string) => {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      return clerkUser.username ?? null;
    },
    updateUser: userController.updateUser,
    deleteUser: userController.deleteUser,
  },
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
export const POST = handlers.POST;
