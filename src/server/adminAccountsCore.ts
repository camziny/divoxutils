export type AdminAccountSearchDeps = {
  isAdminUserId: (userId: string) => boolean;
  findDiscordIdentityLinks: (providerUserId: string) => Promise<{ clerkUserId: string }[]>;
  findClerkUserIdsByDiscordName: (query: string) => Promise<string[]>;
  findUsers: (args: { query: string; identityClerkIds: string[] }) => Promise<
    Array<{
      id: number;
      clerkUserId: string;
      name: string | null;
      email: string;
      characters: Array<{
        character: {
          id: number;
          characterName: string;
          className: string;
          realm: string;
          totalRealmPoints: number;
        };
      }>;
      identityLinks: Array<{ provider: string; providerUserId: string }>;
      _count: { groupUsers: number; identityClaims: number };
    }>
  >;
};

export type AdminAccountDeleteDeps = {
  isAdminUserId: (userId: string) => boolean;
  findLocalUser: (clerkUserId: string) => Promise<{ id: number; name: string | null } | null>;
  deleteLocalUserData: (args: { clerkUserId: string; userId: number }) => Promise<void>;
  deleteClerkUser: (clerkUserId: string) => Promise<void>;
};

function authError(userId: string | null | undefined, isAdminUserId: (userId: string) => boolean) {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
  if (!isAdminUserId(userId)) {
    return { status: 403, body: { error: "Forbidden" } };
  }
  return null;
}

export async function handleAdminAccountSearch(
  input: {
    method: string;
    userId: string | null | undefined;
    queryRaw: unknown;
  },
  deps: AdminAccountSearchDeps
) {
  if (input.method !== "GET") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  const denied = authError(input.userId, deps.isAdminUserId);
  if (denied) return denied;

  const query = typeof input.queryRaw === "string" ? input.queryRaw.trim() : "";
  if (query.length < 2) {
    return { status: 200, body: { users: [] } };
  }

  const [byIdentityLink, byDiscordName] = await Promise.all([
    deps.findDiscordIdentityLinks(query),
    deps.findClerkUserIdsByDiscordName(query),
  ]);
  const identityClerkIds = Array.from(
    new Set([...byIdentityLink.map((link) => link.clerkUserId), ...byDiscordName])
  );

  const users = await deps.findUsers({ query, identityClerkIds });
  const results = users.map((u) => ({
    id: u.id,
    clerkUserId: u.clerkUserId,
    name: u.name,
    email: u.email,
    characters: u.characters.map((uc) => uc.character),
    identityLinks: u.identityLinks,
    groupCount: u._count.groupUsers,
    claimCount: u._count.identityClaims,
  }));

  return { status: 200, body: { users: results } };
}

export async function handleAdminAccountDelete(
  input: {
    method: string;
    userId: string | null | undefined;
    body: Record<string, unknown>;
  },
  deps: AdminAccountDeleteDeps
) {
  if (input.method !== "POST") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  const denied = authError(input.userId, deps.isAdminUserId);
  if (denied) return denied;

  const clerkUserId =
    typeof input.body.clerkUserId === "string" ? input.body.clerkUserId.trim() : "";

  if (!clerkUserId) {
    return { status: 400, body: { error: "clerkUserId is required." } };
  }

  const user = await deps.findLocalUser(clerkUserId);
  const localUserFound = Boolean(user);
  if (localUserFound && user) {
    try {
      await deps.deleteLocalUserData({ clerkUserId, userId: user.id });
    } catch (error: any) {
      return {
        status: 500,
        body: {
          error: error?.message ?? "Failed to delete local user data.",
        },
      };
    }
  }

  try {
    await deps.deleteClerkUser(clerkUserId);
  } catch (error: any) {
    const isNotFound =
      error?.status === 404 || error?.errors?.[0]?.code === "resource_not_found";
    if (!isNotFound) {
      return {
        status: 502,
        body: {
          error:
            "Local cleanup completed, but failed to remove the Clerk account. Please retry Clerk deletion.",
          localUserFound,
        },
      };
    }
    if (!localUserFound) {
      return {
        status: 200,
        body: {
          success: true,
          note: "Local user was already removed and Clerk account was already deleted.",
        },
      };
    }
  }

  if (!localUserFound) {
    return {
      status: 200,
      body: {
        success: true,
        note: "Local user was already removed. Clerk account deleted successfully.",
      },
    };
  }

  return { status: 200, body: { success: true } };
}
