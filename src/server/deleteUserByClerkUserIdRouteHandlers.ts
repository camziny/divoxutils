import { NextRequest, NextResponse } from "next/server";
import {
  type DeleteUserByClerkUserIdDeps,
  handleDeleteUserByClerkUserIdApi,
} from "@/server/deleteUserByClerkUserIdApi";

type RouteDeps = {
  deps: DeleteUserByClerkUserIdDeps;
  apiSecret: string | undefined;
};

export function createDeleteUserByClerkUserIdRouteHandlers(routeDeps: RouteDeps) {
  async function run(
    method: string,
    request: NextRequest,
    context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
  ) {
    const params = await context.params;
    const result = await handleDeleteUserByClerkUserIdApi(
      {
        method,
        apiKey: request.headers.get("x-api-key"),
        apiSecret: routeDeps.apiSecret,
        clerkUserId: typeof params.clerkUserId === "string" ? params.clerkUserId : null,
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
    ) => run("GET", request, context),
    POST: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("POST", request, context),
    PUT: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("PUT", request, context),
    PATCH: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("PATCH", request, context),
    DELETE: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("DELETE", request, context),
    OPTIONS: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("OPTIONS", request, context),
    HEAD: async (
      request: NextRequest,
      context: { params: { clerkUserId?: string } | Promise<{ clerkUserId?: string }> }
    ) => run("HEAD", request, context),
  };
}
