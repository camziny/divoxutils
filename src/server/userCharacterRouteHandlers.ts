import { NextRequest, NextResponse } from "next/server";
import {
  type UserCharacterHandlerDeps,
  handleUserCharacterApi,
} from "@/server/userCharacterApi";

type RouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  deps: UserCharacterHandlerDeps;
};

export function createUserCharacterRouteHandlers(routeDeps: RouteDeps) {
  async function run(
    method: string,
    context: {
      params:
        | { clerkUserId?: string; characterId?: string }
        | Promise<{ clerkUserId?: string; characterId?: string }>;
    }
  ) {
    const params = await context.params;
    const result = await handleUserCharacterApi(
      {
        method,
        clerkUserId:
          typeof params.clerkUserId === "string" ? params.clerkUserId : null,
        characterIdRaw:
          typeof params.characterId === "string" ? params.characterId : null,
        authUserId: await routeDeps.getAuthUserId(),
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
      _request: NextRequest,
      context: {
        params:
          | { clerkUserId?: string; characterId?: string }
          | Promise<{ clerkUserId?: string; characterId?: string }>;
      }
    ) => run("GET", context),
    DELETE: async (
      _request: NextRequest,
      context: {
        params:
          | { clerkUserId?: string; characterId?: string }
          | Promise<{ clerkUserId?: string; characterId?: string }>;
      }
    ) => run("DELETE", context),
  };
}
