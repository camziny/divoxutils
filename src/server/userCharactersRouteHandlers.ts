import { NextRequest, NextResponse } from "next/server";
import { type UserCharactersApiDeps, handleUserCharactersApi } from "@/server/userCharactersApi";

type RouteDeps = {
  deps: UserCharactersApiDeps;
};

export function createUserCharactersRouteHandlers(routeDeps: RouteDeps) {
  async function run(request: NextRequest) {
    const searchParams = new URL(request.url).searchParams;
    const clerkUserIdQuery = searchParams.get("clerkUserId");
    const body =
      request.method === "POST"
        ? ((await request.json().catch(() => null)) as { characterId?: unknown } | null)
        : null;

    const result = await handleUserCharactersApi(
      {
        method: request.method,
        clerkUserIdQuery,
        body,
      },
      routeDeps.deps
    );

    if (result.bodyType === "text") {
      const response = new NextResponse(result.body, { status: result.status });
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      return response;
    }

    const response = NextResponse.json(result.body, { status: result.status });
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  return {
    GET: async (request: NextRequest) => run(request),
    POST: async (request: NextRequest) => run(request),
    DELETE: async (request: NextRequest) => run(request),
  };
}
