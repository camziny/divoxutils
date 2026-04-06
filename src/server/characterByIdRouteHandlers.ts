import { NextRequest, NextResponse } from "next/server";
import { type CharacterByIdDeps, handleCharacterByIdApi } from "@/server/characterByIdApi";

type RouteDeps = {
  deps: CharacterByIdDeps;
};

export function createCharacterByIdRouteHandlers(routeDeps: RouteDeps) {
  async function run(
    method: string,
    request: NextRequest,
    context: { params: { id?: string } | Promise<{ id?: string }> }
  ) {
    const params = await context.params;
    const idRaw = typeof params.id === "string" ? params.id : null;
    const body =
      method === "PUT" ? await request.json().catch(() => undefined) : undefined;

    const result = await handleCharacterByIdApi(
      {
        method,
        idRaw,
        body,
      },
      routeDeps.deps
    );

    if (result.bodyType === "empty") {
      const response = new NextResponse(null, { status: result.status });
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      return response;
    }

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
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run("GET", request, context),
    PUT: async (
      request: NextRequest,
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run("PUT", request, context),
    DELETE: async (
      request: NextRequest,
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run("DELETE", request, context),
    POST: async (
      request: NextRequest,
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run("POST", request, context),
  };
}
