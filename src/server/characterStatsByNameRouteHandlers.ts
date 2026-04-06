import { NextRequest, NextResponse } from "next/server";
import {
  type CharacterStatsByNameDeps,
  handleCharacterStatsByNameApi,
} from "@/server/characterStatsByNameApi";

type RouteDeps = {
  deps: CharacterStatsByNameDeps;
  apiSecret: string | undefined;
};

export function createCharacterStatsByNameRouteHandlers(routeDeps: RouteDeps) {
  async function run(
    method: string,
    request: NextRequest,
    context: { params: { name?: string } | Promise<{ name?: string }> }
  ) {
    const params = await context.params;
    const result = await handleCharacterStatsByNameApi(
      {
        method,
        apiKey: request.headers.get("x-api-key"),
        apiSecret: routeDeps.apiSecret,
        name: typeof params.name === "string" ? params.name : null,
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
    GET: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("GET", request, context),
    POST: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("POST", request, context),
    PUT: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("PUT", request, context),
    PATCH: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("PATCH", request, context),
    DELETE: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("DELETE", request, context),
    OPTIONS: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("OPTIONS", request, context),
    HEAD: async (
      request: NextRequest,
      context: { params: { name?: string } | Promise<{ name?: string }> }
    ) => run("HEAD", request, context),
  };
}
