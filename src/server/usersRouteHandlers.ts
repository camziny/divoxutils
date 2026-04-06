import { NextRequest, NextResponse } from "next/server";
import { type UsersApiDeps, handleUsersApi } from "@/server/usersApi";

type RouteDeps = {
  deps: UsersApiDeps;
};

export function createUsersRouteHandlers(routeDeps: RouteDeps) {
  async function run(request: NextRequest) {
    const searchParams = new URL(request.url).searchParams;
    const name = searchParams.get("name");
    const characterName = searchParams.get("characterName");
    const result = await handleUsersApi(
      {
        method: request.method,
        name,
        characterName,
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
  };
}
