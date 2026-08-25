export type HideProfileResponseBody = { hideProfile?: boolean; error?: string };

export type HideProfileApiDeps = {
  findUserHideProfile: (
    clerkUserId: string
  ) => Promise<{ hideProfile: boolean } | null>;
  findUserByClerkId: (
    clerkUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  updateUserHideProfile: (
    clerkUserId: string,
    hideProfile: boolean
  ) => Promise<{ hideProfile: boolean }>;
  revalidatePublicProfile: () => void;
};

type HideProfileApiInput = {
  method: string;
  clerkUserId: string | null;
  body?: { hideProfile?: unknown } | null;
};

export type HideProfileApiResult = {
  status: number;
  body: HideProfileResponseBody;
  allow?: string;
};

export async function handleHideProfileApi(
  input: HideProfileApiInput,
  deps: HideProfileApiDeps
): Promise<HideProfileApiResult> {
  if (!input.clerkUserId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  if (input.method === "GET") {
    const user = await deps.findUserHideProfile(input.clerkUserId);

    if (!user) {
      return { status: 404, body: { error: "User not found" } };
    }

    return { status: 200, body: { hideProfile: user.hideProfile } };
  }

  if (input.method === "PUT") {
    const hideProfile = input.body?.hideProfile;
    if (typeof hideProfile !== "boolean") {
      return { status: 400, body: { error: "Invalid hideProfile" } };
    }

    const existingUser = await deps.findUserByClerkId(input.clerkUserId);

    if (!existingUser) {
      return { status: 404, body: { error: "User not found" } };
    }

    const user = await deps.updateUserHideProfile(input.clerkUserId, hideProfile);
    deps.revalidatePublicProfile();

    return { status: 200, body: { hideProfile: user.hideProfile } };
  }

  return {
    status: 405,
    allow: "GET, PUT",
    body: { error: "Method not allowed" },
  };
}
