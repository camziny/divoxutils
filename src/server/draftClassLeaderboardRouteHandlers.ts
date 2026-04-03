import { NextRequest, NextResponse } from "next/server";
import {
  type DraftClassLeaderboardApiDeps,
  handleDraftClassLeaderboardApi,
} from "@/server/draftClassLeaderboardApi";

type RouteDeps = {
  deps: DraftClassLeaderboardApiDeps;
};

export function createDraftClassLeaderboardRouteHandlers(routeDeps: RouteDeps) {
  async function run(method: string, request: NextRequest) {
    const className = new URL(request.url).searchParams.get("className");
    const result = await handleDraftClassLeaderboardApi(
      {
        method,
        className,
      },
      routeDeps.deps
    );

    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    GET: async (request: NextRequest) => run("GET", request),
    POST: async (request: NextRequest) => run("POST", request),
    PUT: async (request: NextRequest) => run("PUT", request),
    PATCH: async (request: NextRequest) => run("PATCH", request),
    DELETE: async (request: NextRequest) => run("DELETE", request),
    OPTIONS: async (request: NextRequest) => run("OPTIONS", request),
    HEAD: async (request: NextRequest) => run("HEAD", request),
  };
}
