import { NextRequest, NextResponse } from "next/server";
import { type HideProfileApiDeps, handleHideProfileApi } from "@/server/hideProfileApi";

export type HideProfileRouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  apiDeps: HideProfileApiDeps;
};

export function createHideProfileRouteHandlers(routeDeps: HideProfileRouteDeps) {
  async function runHandler(method: string, request: NextRequest) {
    const clerkUserId = await routeDeps.getAuthUserId();
    const body =
      method === "PUT"
        ? await request.json().catch(() => null)
        : null;

    const result = await handleHideProfileApi(
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
  };
}
