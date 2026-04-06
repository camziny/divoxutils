import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type NameCharacter = {
  id: number;
  webId: string;
  characterName: string | null;
  className: string | null;
  nameLastUpdated: Date | null;
};

type NameUpdateData = {
  nameLastUpdated: Date;
  characterName?: string;
  previousCharacterName?: string | null;
  className?: string;
};

type UpdateCharacterNamesDeps = {
  cronSecret: string | undefined;
  countUnknownCharacters: () => Promise<number>;
  findCharacters: (args: {
    lastProcessedId: number;
    take: number;
    before: Date;
  }) => Promise<NameCharacter[]>;
  updateCharacter: (args: { id: number; data: NameUpdateData }) => Promise<void>;
  fetchImpl: typeof fetch;
  now: () => Date;
};

export function createUpdateCharacterNamesRouteHandlers(
  deps: UpdateCharacterNamesDeps
) {
  async function run(method: string, request: NextRequest) {
    if (
      !hasValidCronAuthorization(
        request.headers.get("authorization"),
        deps.cronSecret
      )
    ) {
      console.error("Authorization failed");
      return unauthorizedCronResponse();
    }

    if (method !== "POST") {
      return postMethodNotAllowedResponse(method);
    }

    try {
      const batchSize = 50;
      let updatedCount = 0;
      let failedCount = 0;
      let lastProcessedId = 0;
      const fourHoursAgo = new Date(deps.now().getTime() - 4 * 60 * 60 * 1000);

      console.log("Starting character name update process");
      const countUnknown = await deps.countUnknownCharacters();
      console.log(`Total characters with 'Unknown' values: ${countUnknown}`);

      while (true) {
        console.log(
          `Processing batch: Last Processed ID = ${lastProcessedId}, Batch Size = ${batchSize}`
        );
        const characters = await deps.findCharacters({
          lastProcessedId,
          take: batchSize,
          before: fourHoursAgo,
        });
        console.log(`Characters in current batch: ${characters.length}`);

        if (characters.length === 0) {
          console.log("No more characters to update in this batch");
          break;
        }

        for (const character of characters) {
          try {
            const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
            const response = await deps.fetchImpl(apiUrl);
            const data = (await response.json()) as {
              name?: string;
              class_name?: string;
            };

            const fullName = data.name;
            const firstName = fullName?.split(" ")[0];
            const className = data.class_name;

            const nameUpdateData: NameUpdateData = {
              nameLastUpdated: deps.now(),
            };

            if (firstName && firstName !== character.characterName) {
              console.log(
                `Updating name for character ID ${character.id} from '${character.characterName}' to '${firstName}'`
              );
              nameUpdateData.characterName = firstName;
              nameUpdateData.previousCharacterName = character.characterName;
            }

            if (className && className !== character.className) {
              console.log(
                `Updating class for character ID ${character.id} from '${character.className}' to '${className}'`
              );
              nameUpdateData.className = className;
            }

            if (Object.keys(nameUpdateData).length > 1) {
              await deps.updateCharacter({ id: character.id, data: nameUpdateData });
              updatedCount++;
            } else {
              await deps.updateCharacter({
                id: character.id,
                data: { nameLastUpdated: deps.now() },
              });
            }
          } catch (error) {
            console.error(
              `Failed to update character ${character.webId}:`,
              error
            );
            failedCount++;
          }
        }

        lastProcessedId = characters[characters.length - 1].id;
      }

      const countRemainingUnknown = await deps.countUnknownCharacters();
      console.log(
        `Characters remaining with 'Unknown' values: ${countRemainingUnknown}`
      );

      return NextResponse.json({
        message: "Character names update process completed",
        updatedCharacters: updatedCount,
        failedUpdates: failedCount,
      });
    } catch (error) {
      console.error("Error running character names update:", error);
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
