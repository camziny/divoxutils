import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type ResettableCharacter = {
  id: number;
};

type ResetLastWeekStatsDeps = {
  cronSecret: string | undefined;
  findCharactersToReset: (args: { lastProcessedId: number; take: number }) => Promise<ResettableCharacter[]>;
  resetCharactersByIds: (ids: number[]) => Promise<void>;
};

export function createResetLastWeekStatsRouteHandlers(deps: ResetLastWeekStatsDeps) {
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

    const batchSize = 50;
    let updatedCount = 0;
    let lastProcessedId = 0;

    while (true) {
      const charactersToUpdate = await deps.findCharactersToReset({
        lastProcessedId,
        take: batchSize,
      });

      if (charactersToUpdate.length === 0) {
        break;
      }

      const idsToUpdate = charactersToUpdate.map((character) => character.id);
      await deps.resetCharactersByIds(idsToUpdate);

      lastProcessedId = charactersToUpdate[charactersToUpdate.length - 1].id;
      updatedCount += charactersToUpdate.length;
    }

    return NextResponse.json({
      message: `Successfully reset last week's stats for ${updatedCount} characters`,
    });
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
