import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  debug: false,
  publicRoutes: [
    "/",
    "/about",
    "/sign-in",
    "/sign-up",
    "/user-characters",
    "/api/clerk-webhook",
    "/api/characters",
    "/api/userCharactersByUserId/:id",
    "/api/characterDetails/",
    "/api/users/:userId",
    "/api/users",
    "/search",
    "/users/(.*)/characters",
    "/users/(.*)/group",
    "/api/leaderboard",
    "/leaderboards",
    "/api/updateLeaderboardStats",
    "/api/batchedLeaderboardUpdate",
    "/character-search",
    "/api/updateCharacterNames",
    "/api/resetLastWeekStats",
    "/api/resetBatchState",
    "/api/groups",
    "/group-builder",
    "/api/group",
    "/api/group/:clerkUserId",
    "/api/group/:groupId/users",
    "/api/group/addUser",
    "/api/group/removeUser",
    "/api/group/moveToActiveGroup",
    "/api/group/group-by-id/:groupId/users",
    "/api/group/group-by-id/:groupId/group-with-characters",
    "/api/group/group-by-name/(.*)",
    "/api/group/group-owner",
    "/user/(.*)/characters",
    "/user/(.*)/group",
    "/api/delete-character-by-web-id",
    "/api/group/saveGroup",
    "/api/group/createGroup",
    "/api/group/deleteGroup",
    "/api/users/characters/(.*)",
    "/api/batchedRealmUpdate",
    "/api/users/stats/(.*)",
    "/api/characters/stats/(.*)",
    "/discord",
    "/api/delete/user/(.*)",
    "/api/batchedHeraldUpdate",
    "/api/resetHeraldBatchState",
    "/api/searchUsersAndCharacters",
  ],
  beforeAuth: (req) => {
    if (req.url.startsWith("/api/users/")) {
      return false;
    }

    if (req.url.startsWith("/api/group/")) {
      return false;
    }
    return undefined;
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
