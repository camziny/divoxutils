import { NextRequest, NextResponse } from "next/server";
import {
  type CharactersByUserIdDeps,
  handleCharactersByUserIdApi,
} from "@/server/charactersByUserIdApi";
import { resolveViewer } from "@/server/viewerAuthorization";

type RouteDeps = {
  deps: CharactersByUserIdDeps;
  getAuthUserId: () => Promise<string | null>;
  isAdminClerkUserId: (clerkUserId: string | null) => boolean;
};

export function createCharactersByUserIdRouteHandlers(routeDeps: RouteDeps) {
  async function run(
    request: NextRequest,
    context: { params: { id?: string } | Promise<{ id?: string }> }
  ) {
    const params = await context.params;
    const userId = typeof params.id === "string" ? params.id : null;
    const { viewerClerkUserId, viewerIsAdmin } = await resolveViewer(
      routeDeps.getAuthUserId,
      routeDeps.isAdminClerkUserId
    );

    const result = await handleCharactersByUserIdApi(
      {
        method: request.method,
        userId,
        viewerClerkUserId,
        viewerIsAdmin,
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
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run(request, context),
    POST: async (
      request: NextRequest,
      context: { params: { id?: string } | Promise<{ id?: string }> }
    ) => run(request, context),
  };
}
