import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type UpdateClassChampionsDeps = {
  cronSecret: string | undefined;
  syncClassChampions: () => Promise<{
    checked: number;
    synced: number;
    invalid: number;
    failed: number;
    results: unknown[];
  }>;
};

export function createUpdateClassChampionsRouteHandlers(
  deps: UpdateClassChampionsDeps
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
      const result = await deps.syncClassChampions();
      return NextResponse.json({
        message: "Class champion sync completed",
        checked: result.checked,
        synced: result.synced,
        invalid: result.invalid,
        failed: result.failed,
        results: result.results,
      });
    } catch (error) {
      console.error("Error syncing class champions:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  }

  return {
    POST: async (request: NextRequest) => run("POST", request),
    GET: async (request: NextRequest) => run("GET", request),
  };
}
