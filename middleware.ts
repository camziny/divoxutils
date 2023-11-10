import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  debug: true,
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
  ],
  beforeAuth: (req) => {
    console.log("Incoming request URL:", req.url);
    if (req.url.startsWith("/api/users/")) {
      console.log("Bypassing auth for /api/users/");
      return false;
    }
    return undefined;
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
