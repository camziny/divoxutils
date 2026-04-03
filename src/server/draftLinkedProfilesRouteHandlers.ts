import { NextRequest, NextResponse } from "next/server";
import {
  type LinkedProfilesApiDeps,
  handleLinkedProfilesApi,
} from "@/server/draftLinkedProfilesApi";

type LinkedProfilesRouteDeps = {
  deps: LinkedProfilesApiDeps;
};

export function createLinkedProfilesRouteHandlers(routeDeps: LinkedProfilesRouteDeps) {
  async function run(method: string, request: NextRequest) {
    const body =
      method === "POST"
        ? ((await request.json().catch(() => null)) as Record<string, unknown> | null)
        : null;
    const result = await handleLinkedProfilesApi(
      {
        method,
        body,
      },
      routeDeps.deps
    );

    const response = NextResponse.json(result.body, { status: result.status });
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        response.headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      });
    }
    return response;
  }

  return {
    POST: async (request: NextRequest) => run("POST", request),
    GET: async (request: NextRequest) => run("GET", request),
    PUT: async (request: NextRequest) => run("PUT", request),
    PATCH: async (request: NextRequest) => run("PATCH", request),
    DELETE: async (request: NextRequest) => run("DELETE", request),
    OPTIONS: async (request: NextRequest) => run("OPTIONS", request),
    HEAD: async (request: NextRequest) => run("HEAD", request),
  };
}
