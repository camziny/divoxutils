type CharactersByUserIdDeps = {
  getUserCharactersByUserId: (userId: string) => Promise<unknown[]>;
};

type CharactersByUserIdInput = {
  method: string;
  userId: string | null;
};

type CharactersByUserIdApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleCharactersByUserIdApi(
  input: CharactersByUserIdInput,
  deps: CharactersByUserIdDeps
): Promise<CharactersByUserIdApiResult> {
  if (!input.userId) {
    return { status: 400, body: { message: "User ID must be a string." }, bodyType: "json" };
  }

  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: "GET" },
      body: `Method ${input.method} Not Allowed`,
      bodyType: "text",
    };
  }

  try {
    const userCharacters = await deps.getUserCharactersByUserId(input.userId);
    if (userCharacters.length === 0) {
      return {
        status: 404,
        body: { message: "No characters found for this user." },
        bodyType: "json",
      };
    }
    return { status: 200, body: userCharacters, bodyType: "json" };
  } catch (error) {
    if (error instanceof Error) {
      return { status: 500, body: { message: error.message }, bodyType: "json" };
    }
    return {
      status: 500,
      body: { message: "An unknown error occurred." },
      bodyType: "json",
    };
  }
}

export type { CharactersByUserIdDeps };
