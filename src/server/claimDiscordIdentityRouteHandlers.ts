import { NextRequest, NextResponse } from "next/server";
import {
  type ClaimDiscordIdentityApiDeps,
  handleClaimDiscordIdentityApi,
} from "@/server/claimDiscordIdentityApi";

type RouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  deps: ClaimDiscordIdentityApiDeps;
};

export function createClaimDiscordIdentityRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string, request: NextRequest) {
    const body =
      method === "POST"
        ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
        : {};
    const result = await handleClaimDiscordIdentityApi(
      {
        method,
        clerkUserId: await routeDeps.getAuthUserId(),
        bodyDiscordUserId:
          typeof body.discordUserId === "string" ? body.discordUserId : null,
        bodyDraftId: typeof body.draftId === "string" ? body.draftId : null,
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
