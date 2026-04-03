import { NextRequest, NextResponse } from "next/server";
import { type PendingClaimsApiDeps, handlePendingClaimsApi } from "@/server/pendingClaimsApi";

type RouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  deps: PendingClaimsApiDeps;
};

export function createPendingClaimsRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string) {
    const result = await handlePendingClaimsApi(
      {
        method,
        clerkUserId: await routeDeps.getAuthUserId(),
      },
      routeDeps.deps
    );

    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    GET: async (_request: NextRequest) => run("GET"),
    POST: async (_request: NextRequest) => run("POST"),
    PUT: async (_request: NextRequest) => run("PUT"),
    PATCH: async (_request: NextRequest) => run("PATCH"),
    DELETE: async (_request: NextRequest) => run("DELETE"),
    OPTIONS: async (_request: NextRequest) => run("OPTIONS"),
    HEAD: async (_request: NextRequest) => run("HEAD"),
  };
}
