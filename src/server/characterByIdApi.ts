type CharacterByIdDeps = {
  getCharacterById: (id: number) => Promise<unknown | null>;
  updateCharacter: (id: number, data: unknown) => Promise<unknown>;
  deleteCharacter: (id: number) => Promise<unknown>;
};

type CharacterByIdInput = {
  method: string;
  idRaw: string | null;
  body: unknown;
};

type CharacterByIdApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" }
  | { status: number; headers?: Record<string, string>; bodyType: "empty" };

function parseCharacterId(idRaw: string | null): number | null {
  if (!idRaw) {
    return null;
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function handleCharacterByIdApi(
  input: CharacterByIdInput,
  deps: CharacterByIdDeps
): Promise<CharacterByIdApiResult> {
  const id = parseCharacterId(input.idRaw);
  if (id === null) {
    return {
      status: 400,
      body: { message: "Character ID must be a positive integer." },
      bodyType: "json",
    };
  }

  if (input.method === "GET") {
    try {
      const character = await deps.getCharacterById(id);
      if (!character) {
        return { status: 404, body: { message: "Character not found." }, bodyType: "json" };
      }
      return { status: 200, body: character, bodyType: "json" };
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

  if (input.method === "PUT") {
    try {
      const updatedCharacter = await deps.updateCharacter(id, input.body);
      return { status: 200, body: updatedCharacter, bodyType: "json" };
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

  if (input.method === "DELETE") {
    try {
      await deps.deleteCharacter(id);
      return { status: 204, bodyType: "empty" };
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
    headers: { Allow: "GET, PUT, DELETE" },
    body: `Method ${input.method} Not Allowed`,
    bodyType: "text",
  };
}

export type { CharacterByIdDeps };
