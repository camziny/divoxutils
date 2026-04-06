type UserCharactersApiDeps = {
  getAuthUserId: () => Promise<string | null>;
  getUserCharacters: (clerkUserId: string) => Promise<unknown>;
  createUserCharacter: (data: {
    clerkUserId: string;
    characterId: unknown;
  }) => Promise<unknown>;
};

type UserCharactersApiInput = {
  method: string;
  clerkUserIdQuery: string | null;
  body: { characterId?: unknown } | null;
};

type UserCharactersApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleUserCharactersApi(
  input: UserCharactersApiInput,
  deps: UserCharactersApiDeps
): Promise<UserCharactersApiResult> {
  if (input.method === "GET") {
    const authUserId = await deps.getAuthUserId();
    if (!authUserId) {
      return { status: 401, body: { error: "Unauthorized" }, bodyType: "json" };
    }

    const targetUserId = input.clerkUserIdQuery ?? authUserId;
    if (targetUserId !== authUserId) {
      return { status: 403, body: { message: "Forbidden" }, bodyType: "json" };
    }

    try {
      const userCharacters = await deps.getUserCharacters(targetUserId);
      return { status: 200, body: userCharacters, bodyType: "json" };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 500, body: { message: error.message }, bodyType: "json" };
      }
      return {
        status: 500,
        body: { message: "An unknown error occurred" },
        bodyType: "json",
      };
    }
  }

  if (input.method === "POST") {
    const authUserId = await deps.getAuthUserId();
    if (!authUserId) {
      return { status: 401, body: { error: "Unauthorized" }, bodyType: "json" };
    }

    try {
      const characterId = input.body?.characterId;
      const userCharacter = await deps.createUserCharacter({
        clerkUserId: authUserId,
        characterId,
      });
      return { status: 201, body: userCharacter, bodyType: "json" };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 500, body: { message: error.message }, bodyType: "json" };
      }
      return {
        status: 500,
        body: { message: "An unknown error occurred" },
        bodyType: "json",
      };
    }
  }

  return {
    status: 405,
    headers: { Allow: "GET, POST" },
    body: `Method ${input.method} Not Allowed`,
    bodyType: "text",
  };
}

export type { UserCharactersApiDeps };
