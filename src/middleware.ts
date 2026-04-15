import { clerkMiddleware } from "@clerk/nextjs/server";

const PROD_BLOCKED_TEST_ROUTES = new Set([
  "/test",
  "/test/support-modal",
  "/test/loading",
  "/test/draft",
  "/test/draft-history",
  "/test/draft-history/link-card",
]);

export default clerkMiddleware((_auth, req) => {
  if (
    process.env.NODE_ENV === "production" &&
    PROD_BLOCKED_TEST_ROUTES.has(req.nextUrl.pathname)
  ) {
    return new Response("Not Found", { status: 404 });
  }
});

export const config = {
  matcher: ["/(.*)"],
};
