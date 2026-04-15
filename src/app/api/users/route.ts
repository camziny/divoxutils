import * as userController from "@/server/services/userService";
import { createUsersRouteHandlers } from "@/server/usersRouteHandlers";

const handlers = createUsersRouteHandlers({
  deps: {
    getUsers: userController.getUsers,
    getUserByName: userController.getUserByName,
    getUsersByPartialName: userController.getUsersByPartialName,
    getUserByCharacterName: userController.getUserByCharacterName,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
