import { authMiddleware } from "@clerk/nextjs";

const publicRoutePatterns = [
  /^\/$/,
  /^\/about$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/sign-up(?:\/.*)?$/,
  /^\/realm-ranks$/,
  /^\/user-characters$/,
  /^\/search$/,
  /^\/leaderboards$/,
  /^\/character-search$/,
  /^\/group-builder$/,
  /^\/discord$/,
  /^\/draft(?:\/.*)?$/,
  /^\/user\/[^/]+\/characters$/,
  /^\/user\/[^/]+\/group$/,
  /^\/users\/[^/]+\/characters$/,
  /^\/users\/[^/]+\/group$/,
  /^\/api\/clerk-webhook$/,
  /^\/api\/characters$/,
  /^\/api\/characterDetails(?:\/.*)?$/,
  /^\/api\/userCharactersByUserId\/[^/]+$/,
  /^\/api\/leaderboard$/,
  /^\/api\/updateLeaderboardStats$/,
  /^\/api\/batchedLeaderboardUpdate$/,
  /^\/api\/updateCharacterNames$/,
  /^\/api\/resetLastWeekStats$/,
  /^\/api\/resetBatchState$/,
  /^\/api\/groups$/,
  /^\/api\/group(?:\/.*)?$/,
  /^\/api\/users$/,
  /^\/api\/users(?:\/.*)?$/,
  /^\/api\/batchedRealmUpdate$/,
  /^\/api\/delete-character-by-web-id$/,
  /^\/api\/delete\/user(?:\/.*)?$/,
  /^\/api\/batchedHeraldUpdate$/,
  /^\/api\/resetHeraldBatchState$/,
  /^\/api\/searchUsersAndCharacters$/,
];

export default authMiddleware({
  debug: false,
  publicRoutes: (req) =>
    publicRoutePatterns.some((pattern) => pattern.test(req.nextUrl.pathname)),
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
