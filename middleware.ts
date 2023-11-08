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
  ],
  beforeAuth: (req) => {
    console.log(`Request URL: ${req.url}`);
    if (req.url.startsWith("/api/users/")) {
      console.log("Bypassing Clerk authentication for:", req.url);
      return false;
    }
    return undefined;
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
