import { NextRequest, NextResponse } from "next/server";
import { type LayoutPreferenceApiDeps, handleLayoutPreferenceApi } from "@/server/layoutPreferenceApi";

export type LayoutPreferenceRouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  apiDeps: LayoutPreferenceApiDeps;
};

export function createLayoutPreferenceRouteHandlers(routeDeps: LayoutPreferenceRouteDeps) {
  async function runHandler(method: string, request: NextRequest) {
    const clerkUserId = await routeDeps.getAuthUserId();
    const body =
      method === "PUT"
        ? await request.json().catch(() => null)
        : null;

    const result = await handleLayoutPreferenceApi(
      {
        method,
        clerkUserId,
        body,
      },
      routeDeps.apiDeps
    );

    const response = NextResponse.json(result.body, { status: result.status });
    if (result.allow) {
      response.headers.set("Allow", result.allow);
    }
    return response;
  }

  return {
    GET: async (request: NextRequest) => runHandler("GET", request),
    PUT: async (request: NextRequest) => runHandler("PUT", request),
    POST: async (request: NextRequest) => runHandler("POST", request),
  };
}
