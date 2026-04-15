import {
  deleteUserByClerkUserId,
  getUserByClerkUserId,
} from "@/server/services/userService";
import { createDeleteUserByClerkUserIdRouteHandlers } from "@/server/deleteUserByClerkUserIdRouteHandlers";

const handlers = createDeleteUserByClerkUserIdRouteHandlers({
  apiSecret: process.env.DISCORD_BOT_API_KEY,
  deps: {
    getUserByClerkUserId,
    deleteUserByClerkUserId,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
