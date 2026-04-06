import { NextRequest, NextResponse } from "next/server";
import {
  type GetCurrentUserDeps,
  handleGetCurrentUserApi,
} from "@/server/getCurrentUserApi";

type RouteDeps = {
  deps: GetCurrentUserDeps;
};

export function createGetCurrentUserRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string) {
    const result = await handleGetCurrentUserApi({ method }, routeDeps.deps);

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
    GET: async (request: NextRequest) => run(request.method),
    POST: async (request: NextRequest) => run(request.method),
  };
}
