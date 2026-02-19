import { authMiddleware } from "@clerk/nextjs";

const publicPathPatterns = [
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

const isPublicPath = (pathname: string) =>
  publicPathPatterns.some((pattern) => pattern.test(pathname));

export default authMiddleware({
  debug: false,
  publicRoutes: (req) => isPublicPath(req.nextUrl.pathname),
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
