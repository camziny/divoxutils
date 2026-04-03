import { NextRequest, NextResponse } from "next/server";
import { type UserByClerkIdDeps, handleUserByClerkIdApi } from "@/server/userByClerkIdApi";

type RouteDeps = {
  deps: UserByClerkIdDeps;
};

export function createUserByClerkIdRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string, request: NextRequest, clerkUserId?: string) {
    const idRaw = new URL(request.url).searchParams.get("id");
    const body =
      method === "PUT"
        ? await request.json().catch(() => undefined)
        : undefined;

    const result = await handleUserByClerkIdApi(
      {
        method,
        clerkUserId: clerkUserId ?? null,
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
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => {
      const params = await context.params;
      return run("GET", request, params.clerkUserId);
    },
    PUT: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => {
      const params = await context.params;
      return run("PUT", request, params.clerkUserId);
    },
    DELETE: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => {
      const params = await context.params;
      return run("DELETE", request, params.clerkUserId);
    },
    POST: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => {
      const params = await context.params;
      return run("POST", request, params.clerkUserId);
    },
  };
}
