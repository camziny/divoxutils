import { NextRequest, NextResponse } from "next/server";
import {
  type LinkDiscordIdentityApiDeps,
  handleLinkDiscordIdentityApi,
} from "@/server/linkDiscordIdentityApi";

type RouteDeps = {
  getAuthUserId: () => Promise<string | null>;
  deps: LinkDiscordIdentityApiDeps;
};

export function createLinkDiscordIdentityRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string, request: NextRequest) {
    const body =
      method === "POST"
        ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
        : {};
    const bodyDiscordUserId =
      typeof body.discordUserId === "string" ? body.discordUserId : null;

    const result = await handleLinkDiscordIdentityApi(
      {
        method,
        clerkUserId: await routeDeps.getAuthUserId(),
        bodyDiscordUserId,
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
