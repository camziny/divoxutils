import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import {
  getUserCharacterById,
  deleteUserCharacter,
} from "../../../../controllers/userCharacterController";

type RouteContext = {
  params: {
    characterId: string;
  };
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const characterId = Number.parseInt(context.params.characterId, 10);
  if (Number.isNaN(characterId)) {
    return NextResponse.json({ message: "Invalid characterId." }, { status: 400 });
  }

  const compoundKey = { clerkUserId, characterId };
  const userCharacter = await getUserCharacterById(compoundKey);

  if (!userCharacter) {
    return NextResponse.json(
      {
        message: `UserCharacter with userId ${clerkUserId} and characterId ${characterId} not found.`,
      },
      { status: 404 }
    );
  }

  await deleteUserCharacter(compoundKey);
  revalidateTag("public-user-characters");
  const response = NextResponse.json(
    { message: "Character successfully deleted" },
    { status: 200 }
  );
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  return response;
}
