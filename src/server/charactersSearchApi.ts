export type CharactersSearchApiInput = {
  method: string;
  name: string | null;
  cluster: string | null;
};

export type CharactersSearchApiDeps = {
  fetchCharacterDetails: (name: string, cluster: string) => Promise<unknown>;
};

type CharactersSearchApiResult =
  | {
      status: number;
      headers?: Record<string, string | string[]>;
      bodyType: "text";
      body: string;
    }
  | {
      status: number;
      headers?: Record<string, string | string[]>;
      bodyType: "json";
      body: unknown;
    };

export async function handleCharactersSearchApi(
  input: CharactersSearchApiInput,
  deps: CharactersSearchApiDeps
): Promise<CharactersSearchApiResult> {
  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: ["GET"] },
      bodyType: "text",
      body: `Method ${input.method} Not Allowed`,
    };
  }

  if (!input.name || !input.cluster) {
    return {
      status: 400,
      bodyType: "json",
      body: { message: "Name and cluster are required" },
    };
  }

  try {
    const characters = await deps.fetchCharacterDetails(input.name, input.cluster);
    return {
      status: 200,
      bodyType: "json",
      body: characters,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: 500,
        bodyType: "json",
        body: { message: error.message },
      };
    }
    return {
      status: 500,
      bodyType: "json",
      body: { message: "An unknown error occurred" },
    };
  }
}
