import {
  getAllUserNames,
  getUserCharactersByUserName,
} from "@/controllers/userCharacterController";
import { createUsersCharactersByNameRouteHandlers } from "@/server/usersCharactersByNameRouteHandlers";

const handlers = createUsersCharactersByNameRouteHandlers({
  apiSecret: process.env.DISCORD_BOT_API_KEY,
  deps: {
    getAllUserNames,
    getUserCharactersByUserName,
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
