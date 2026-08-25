import { NextRequest, NextResponse } from "next/server";
import {
  type UserCharactersByUserIdDeps,
  handleUserCharactersByUserIdApi,
} from "@/server/userCharactersByUserIdApi";
import { resolveViewer } from "@/server/viewerAuthorization";

type RouteDeps = {
  deps: UserCharactersByUserIdDeps;
  getAuthUserId: () => Promise<string | null>;
  isAdminClerkUserId: (clerkUserId: string | null) => boolean;
};

export function createUserCharactersByUserIdRouteHandlers(routeDeps: RouteDeps) {
  return {
    GET: async (
      request: NextRequest,
      context: { params: { userId?: string } | Promise<{ userId?: string }> }
    ) => {
      const params = await context.params;
      const userId = typeof params.userId === "string" ? params.userId : null;
      const { viewerClerkUserId, viewerIsAdmin } = await resolveViewer(
        routeDeps.getAuthUserId,
        routeDeps.isAdminClerkUserId
      );
      const result = await handleUserCharactersByUserIdApi(
        {
          method: "GET",
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
    },
    POST: async (
      request: NextRequest,
      context: { params: { userId?: string } | Promise<{ userId?: string }> }
    ) => {
      const params = await context.params;
      const userId = typeof params.userId === "string" ? params.userId : null;
      const result = await handleUserCharactersByUserIdApi(
        {
          method: "POST",
          userId,
          viewerClerkUserId: null,
          viewerIsAdmin: false,
        },
        routeDeps.deps
      );
      const response = new NextResponse(
        result.bodyType === "text" ? result.body : JSON.stringify(result.body),
        {
          status: result.status,
          headers:
            result.bodyType === "text"
              ? undefined
              : { "Content-Type": "application/json" },
        }
      );
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      return response;
    },
  };
}
