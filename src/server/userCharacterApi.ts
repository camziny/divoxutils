type UserCharacterHandlerDeps = {
  getUserCharacterById: (ids: {
    clerkUserId: string;
    characterId: number;
  }) => Promise<{ clerkUserId: string; characterId: number } | null>;
  deleteUserCharacter: (ids: {
    clerkUserId: string;
    characterId: number;
  }) => Promise<unknown>;
};

type UserCharacterInput = {
  method: string;
  clerkUserId: string | null;
  characterIdRaw: string | null;
  authUserId: string | null;
};

type UserCharacterApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleUserCharacterApi(
  input: UserCharacterInput,
  deps: UserCharacterHandlerDeps
): Promise<UserCharacterApiResult> {
  const characterId = parseInt(input.characterIdRaw ?? "", 10);

  if (isNaN(characterId)) {
    return { status: 400, body: { message: "Invalid characterId." }, bodyType: "json" };
  }

  if (!input.clerkUserId) {
    return {
      status: 400,
      body: { message: "clerkUserId must be a single string." },
      bodyType: "json",
    };
  }

  const compoundKey = { clerkUserId: input.clerkUserId, characterId };

  if (input.method === "GET") {
    try {
      const userCharacter = await deps.getUserCharacterById(compoundKey);
      if (userCharacter) {
        return { status: 200, body: userCharacter, bodyType: "json" };
      }
      return { status: 404, body: { message: "UserCharacter not found." }, bodyType: "json" };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 500, body: { message: error.message }, bodyType: "json" };
      }
      return { status: 500, body: { message: "An unknown error occurred" }, bodyType: "json" };
    }
  }

  if (input.method === "DELETE") {
    try {
      if (!input.authUserId) {
        return { status: 401, body: { message: "Unauthorized" }, bodyType: "json" };
      }

      if (input.authUserId !== input.clerkUserId) {
        return {
          status: 403,
          body: { message: "Unauthorized operation: User does not own this character." },
          bodyType: "json",
        };
      }

      const userCharacter = await deps.getUserCharacterById(compoundKey);

      if (!userCharacter) {
        console.warn(
          `UserCharacter with userId ${input.clerkUserId} and characterId ${characterId} not found.`
        );
        return {
          status: 404,
          body: {
            message: `UserCharacter with userId ${input.clerkUserId} and characterId ${characterId} not found.`,
          },
          bodyType: "json",
        };
      }

      if (userCharacter.clerkUserId !== input.authUserId) {
        console.warn("Unauthorized operation: Mismatched userIds.");
        return {
          status: 403,
          body: { message: "Unauthorized operation: User does not own this character." },
          bodyType: "json",
        };
      }

      await deps.deleteUserCharacter(compoundKey);

      return {
        status: 200,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        body: { message: "Character successfully deleted" },
        bodyType: "json",
      };
    } catch (error) {
      console.error(
        `Error deleting character with userId ${input.clerkUserId} and characterId ${characterId} :`,
        error
      );
      if (error instanceof Error) {
        return { status: 500, body: { message: error.message }, bodyType: "json" };
      }
      return { status: 500, body: { message: "An unknown error occurred" }, bodyType: "json" };
    }
  }

  return {
    status: 405,
    headers: { Allow: "GET, DELETE" },
    body: `Method ${input.method} Not Allowed`,
    bodyType: "text",
  };
}

export type { UserCharacterHandlerDeps };
