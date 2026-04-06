type UsersApiDeps = {
  getUsers: () => Promise<unknown>;
  getUserByName: (name: string) => Promise<unknown[]>;
  getUsersByPartialName: (name: string) => Promise<unknown>;
  getUserByCharacterName: (characterName: string) => Promise<unknown>;
};

type UsersApiInput = {
  method: string;
  name: string | null;
  characterName: string | null;
};

type UsersApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleUsersApi(
  input: UsersApiInput,
  deps: UsersApiDeps
): Promise<UsersApiResult> {
  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: "GET" },
      body: `Method ${input.method} Not Allowed`,
      bodyType: "text",
    };
  }

  const headers = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };

  try {
    if (input.characterName) {
      const users = await deps.getUserByCharacterName(input.characterName);
      return { status: 200, headers, body: users, bodyType: "json" };
    }

    if (input.name) {
      const exactUserMatch = await deps.getUserByName(input.name);
      if (exactUserMatch.length > 0) {
        return { status: 200, headers, body: exactUserMatch, bodyType: "json" };
      }
      const users = await deps.getUsersByPartialName(input.name);
      return { status: 200, headers, body: users, bodyType: "json" };
    }

    const users = await deps.getUsers();
    return { status: 200, headers, body: users, bodyType: "json" };
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

export type { UsersApiDeps };
