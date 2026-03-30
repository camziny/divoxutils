import { currentUser } from "@clerk/nextjs/server";
import prisma from "../../prisma/prismaClient";

export type CharacterListLayout = "table" | "realm-grid";

const VALID_LAYOUTS: CharacterListLayout[] = ["table", "realm-grid"];

export const isCharacterListLayout = (value: unknown): value is CharacterListLayout =>
  typeof value === "string" && VALID_LAYOUTS.includes(value as CharacterListLayout);

export const getCurrentUserCharacterListLayoutPreference = async (): Promise<CharacterListLayout | null> => {
  let clerkUserId: string | null = null;
  try {
    const user = await currentUser();
    clerkUserId = user?.id ?? null;
  } catch {
    clerkUserId = null;
  }

  if (!clerkUserId) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { preferredCharacterListLayout: true },
  });

  if (!dbUser) {
    return null;
  }

  return isCharacterListLayout(dbUser.preferredCharacterListLayout)
    ? dbUser.preferredCharacterListLayout
    : "table";
};
