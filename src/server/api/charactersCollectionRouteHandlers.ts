import { NextResponse } from "next/server";

export type CharactersCollectionDeps = {
  getClerkUserId: () => Promise<string | null>;
  findUserByClerkId: (
    clerkUserId: string
  ) => Promise<{ id: number } | null>;
  findUserById: (id: number) => Promise<unknown | null>;
  getCharacters: () => Promise<unknown>;
  addCharactersToUserList: (
    characters: unknown[],
    userId: number
  ) => Promise<unknown>;
};

function handleError(error: unknown) {
  if (error instanceof Error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { message: "An unknown error occurred" },
    { status: 500 }
  );
}

export function createCharactersCollectionRouteHandlers(
  deps: CharactersCollectionDeps
) {
  return {
    GET: async (request: Request) => {
      if (request.method !== "GET") {
        const response = new NextResponse(
          `Method ${request.method} Not Allowed`,
          { status: 405 }
        );
        response.headers.set("Allow", "GET");
        return response;
      }

      const clerkUserId = await deps.getClerkUserId();
      if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await deps.findUserByClerkId(clerkUserId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found in our database." },
          { status: 404 }
        );
      }

      try {
        const characters = await deps.getCharacters();
        return NextResponse.json(characters);
      } catch (error) {
        return handleError(error);
      }
    },

    POST: async (request: Request) => {
      if (request.method !== "POST") {
        const response = new NextResponse(
          `Method ${request.method} Not Allowed`,
          { status: 405 }
        );
        response.headers.set("Allow", "POST");
        return response;
      }

      const clerkUserId = await deps.getClerkUserId();
      if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await deps.findUserByClerkId(clerkUserId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found in our database." },
          { status: 404 }
        );
      }

      try {
        const body = await request.json().catch(() => null);
        if (!Array.isArray(body?.characters)) {
          throw new Error("Expected an array of character details.");
        }

        const foundUser = await deps.findUserById(user.id);
        if (!foundUser) {
          throw new Error(`No user found with ID: ${user.id}`);
        }

        const addedCharacters = await deps.addCharactersToUserList(
          body.characters,
          user.id
        );

        return NextResponse.json({ addedCharacters }, { status: 201 });
      } catch (error) {
        console.error(
          `Error in POST /api/characters for userId ${user.id}:`,
          error
        );
        return handleError(error);
      }
    },
  };
}
