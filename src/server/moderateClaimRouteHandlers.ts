import { NextRequest, NextResponse } from "next/server";
import { type ModerateClaimApiDeps, handleModerateClaimApi } from "@/server/moderateClaimApi";

type RouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  deps: ModerateClaimApiDeps;
};

export function createModerateClaimRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string, request: NextRequest) {
    const body =
      method === "POST"
        ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
        : {};
    const claimId =
      typeof body.claimId === "number"
        ? body.claimId
        : typeof body.claimId === "string"
          ? Number(body.claimId)
          : null;
    const result = await handleModerateClaimApi(
      {
        method,
        clerkUserId: await routeDeps.getAuthUserId(),
        claimId: typeof claimId === "number" && Number.isFinite(claimId) ? claimId : null,
        action: typeof body.action === "string" ? body.action : null,
      },
      routeDeps.deps
    );

    return NextResponse.json(result.body, { status: result.status });
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
