import { authMiddleware } from "@clerk/nextjs";

const PROD_BLOCKED_TEST_ROUTES = new Set([
  "/draft/test",
  "/draft-history/test",
  "/draft-history/link-test",
]);

export default authMiddleware({
  debug: false,
  signInUrl: "/sign-in",
  afterAuth: (_auth, req) => {
    if (
      process.env.NODE_ENV === "production" &&
      PROD_BLOCKED_TEST_ROUTES.has(req.nextUrl.pathname)
    ) {
      return new Response("Not Found", { status: 404 });
    }
  },
  publicRoutes: [
    "/",
    "/about",
    "/contribute",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/realm-ranks",
    "/user-characters",
    "/search",
    "/leaderboards",
    "/character-search",
    "/group-builder",
    "/discord",
    "/draft(.*)",
    "/draft-history(.*)",
    "/api/draft-stats(.*)",
    "/user/(.*)/characters",
    "/user/(.*)/group",
    "/users/(.*)/characters",
    "/users/(.*)/group",
    "/api/clerk-webhook",
    "/api/characters",
    "/api/characterDetails(.*)",
    "/api/userCharactersByUserId/(.*)",
    "/api/leaderboard",
    "/api/updateLeaderboardStats",
    "/api/batchedLeaderboardUpdate",
    "/api/updateCharacterNames",
    "/api/resetLastWeekStats",
    "/api/resetBatchState",
    "/api/groups",
    "/api/group(.*)",
    "/api/users",
    "/api/users/(.*)",
    "/api/batchedRealmUpdate",
    "/api/delete-character-by-web-id",
    "/api/delete/user/(.*)",
    "/api/batchedHeraldUpdate",
    "/api/resetHeraldBatchState",
    "/api/searchUsersAndCharacters",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
