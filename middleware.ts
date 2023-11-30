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
  ],
  beforeAuth: (req) => {
    if (req.url.startsWith("/api/users/")) {
      return false;
    }
    return undefined;
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
