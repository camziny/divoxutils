import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type ResetHeraldBatchStateDeps = {
  cronSecret: string | undefined;
  resetHeraldBatchState: () => Promise<void>;
};

export function createResetHeraldBatchStateRouteHandlers(
  deps: ResetHeraldBatchStateDeps
) {
  async function run(method: string, request: NextRequest) {
    if (
      !hasValidCronAuthorization(
        request.headers.get("authorization"),
        deps.cronSecret
      )
    ) {
      return unauthorizedCronResponse();
    }

    if (method !== "POST") {
      return postMethodNotAllowedResponse(method);
    }

    try {
      await deps.resetHeraldBatchState();
      return NextResponse.json({ message: "Herald batch state reset successfully" });
    } catch (error) {
      console.error("Error resetting herald batch state:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
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
