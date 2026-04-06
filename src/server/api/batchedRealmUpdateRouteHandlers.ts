import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type RealmCharacter = {
  id: number;
  webId: string;
};

type BatchedRealmUpdateDeps = {
  cronSecret: string | undefined;
  getLastProcessedCharacterId: () => Promise<number>;
  updateLastProcessedCharacterId: (lastId: number) => Promise<void>;
  findCharacters: (args: { lastProcessedId: number; take: number }) => Promise<RealmCharacter[]>;
  updateCharacterRealm: (args: { id: number; realm: string }) => Promise<void>;
  fetchImpl: typeof fetch;
};

async function fetchCharacterRealm(fetchImpl: typeof fetch, webId: string) {
  const apiUrl = `https://api.camelotherald.com/character/info/${webId}`;
  try {
    const response = await fetchImpl(apiUrl);
    const data = (await response.json()) as { realm?: number | null };
    return data.realm ?? null;
  } catch (error) {
    console.error("Failed to fetch character realm for webId:", webId, error);
    return null;
  }
}

export function createBatchedRealmUpdateRouteHandlers(deps: BatchedRealmUpdateDeps) {
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
      const batchSize = 100;
      let updatedCount = 0;
      let failedCount = 0;
      const lastProcessedId = await deps.getLastProcessedCharacterId();

      const characters = await deps.findCharacters({
        lastProcessedId,
        take: batchSize,
      });

      for (const character of characters) {
        try {
          const realmId = await fetchCharacterRealm(deps.fetchImpl, character.webId);
          if (realmId !== 1 && realmId !== 2 && realmId !== 3) {
            failedCount++;
            continue;
          }
          const realmName =
            realmId === 1 ? "Albion" : realmId === 2 ? "Midgard" : "Hibernia";
          await deps.updateCharacterRealm({ id: character.id, realm: realmName });
          updatedCount++;
        } catch (error) {
          console.error(
            `Failed to update realm for character ${character.id}:`,
            error
          );
          failedCount++;
        }
      }

      if (characters.length > 0) {
        const newLastProcessedId = characters[characters.length - 1].id;
        await deps.updateLastProcessedCharacterId(newLastProcessedId);
      }

      return NextResponse.json({
        message: "Batch realm update process completed",
        updatedRealms: updatedCount,
        failedUpdates: failedCount,
      });
    } catch (error) {
      console.error("Error running batched realm update:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
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
