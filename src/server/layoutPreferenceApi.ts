import { isCharacterListLayout, type CharacterListLayout } from "@/server/characterListLayoutPreference";

export type LayoutPreferenceResponseBody = { layout?: CharacterListLayout; error?: string };

export type LayoutPreferenceApiDeps = {
  findUserLayout: (
    clerkUserId: string
  ) => Promise<{ preferredCharacterListLayout: string } | null>;
  findUserByClerkId: (
    clerkUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  updateUserLayout: (
    clerkUserId: string,
    layout: CharacterListLayout
  ) => Promise<{ preferredCharacterListLayout: string }>;
};

type LayoutPreferenceApiInput = {
  method: string;
  clerkUserId: string | null;
  body?: { layout?: unknown } | null;
};

export type LayoutPreferenceApiResult = {
  status: number;
  body: LayoutPreferenceResponseBody;
  allow?: string;
};

export async function handleLayoutPreferenceApi(
  input: LayoutPreferenceApiInput,
  deps: LayoutPreferenceApiDeps
): Promise<LayoutPreferenceApiResult> {
  if (!input.clerkUserId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  if (input.method === "GET") {
    const user = await deps.findUserLayout(input.clerkUserId);

    if (!user) {
      return { status: 404, body: { error: "User not found" } };
    }

    const layout = isCharacterListLayout(user.preferredCharacterListLayout)
      ? user.preferredCharacterListLayout
      : "table";

    return { status: 200, body: { layout } };
  }

  if (input.method === "PUT") {
    const layout = input.body?.layout;
    if (!isCharacterListLayout(layout)) {
      return { status: 400, body: { error: "Invalid layout" } };
    }

    const existingUser = await deps.findUserByClerkId(input.clerkUserId);

    if (!existingUser) {
      return { status: 404, body: { error: "User not found" } };
    }

    const user = await deps.updateUserLayout(input.clerkUserId, layout);

    const responseLayout = isCharacterListLayout(user.preferredCharacterListLayout)
      ? user.preferredCharacterListLayout
      : "table";

    return { status: 200, body: { layout: responseLayout } };
  }

  return {
    status: 405,
    allow: "GET, PUT",
    body: { error: "Method not allowed" },
  };
}
