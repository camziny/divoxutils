type BackfillSummary = {
  scannedUsers: number;
  linked: number;
  skippedNoDiscord: number;
  skippedMissingClerkUser: number;
  skippedAlreadyLinkedToOther: number;
  skippedErrors: number;
  errors: Array<{ clerkUserId: string; reason: string }>;
};

export type AdminIdentityBackfillDeps = {
  isAdminUserId: (userId: string) => boolean;
  listUnlinkedLocalUsers: (args: {
    afterId?: number;
    take: number;
  }) => Promise<Array<{ id: number; clerkUserId: string }>>;
  getDiscordUserIdFromClerk: (clerkUserId: string) => Promise<string | null>;
  findLinkByProviderUserId: (
    provider: string,
    providerUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  upsertIdentityLink: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
    status: string;
  }) => Promise<unknown>;
};

const BATCH_SIZE = 100;

function isClerkNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; errors?: Array<{ code?: string }> };
  if (maybe.status === 404) return true;
  if (Array.isArray(maybe.errors) && maybe.errors.some((entry) => entry?.code === "resource_not_found")) {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("not found");
}

function authError(userId: string | null | undefined, isAdminUserId: (userId: string) => boolean) {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
  if (!isAdminUserId(userId)) {
    return { status: 403, body: { error: "Forbidden" } };
  }
  return null;
}

export async function handleAdminIdentityBackfill(
  input: {
    method: string;
    userId: string | null | undefined;
    body: Record<string, unknown>;
  },
  deps: AdminIdentityBackfillDeps
) {
  if (input.method !== "POST") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  const denied = authError(input.userId, deps.isAdminUserId);
  if (denied) return denied;

  const rawCursor = input.body.cursor;
  const parsedCursor =
    typeof rawCursor === "number" && Number.isFinite(rawCursor)
      ? Math.floor(rawCursor)
      : undefined;
  const cursor = parsedCursor && parsedCursor > 0 ? parsedCursor : undefined;
  const users = await deps.listUnlinkedLocalUsers({
    afterId: cursor,
    take: BATCH_SIZE + 1,
  });
  const hasMore = users.length > BATCH_SIZE;
  const batchUsers = hasMore ? users.slice(0, BATCH_SIZE) : users;
  const nextCursor = hasMore
    ? batchUsers[batchUsers.length - 1]?.id ?? null
    : null;

  const summary: BackfillSummary = {
    scannedUsers: batchUsers.length,
    linked: 0,
    skippedNoDiscord: 0,
    skippedMissingClerkUser: 0,
    skippedAlreadyLinkedToOther: 0,
    skippedErrors: 0,
    errors: [],
  };

  for (const user of batchUsers) {
    try {
      const discordUserId = await deps.getDiscordUserIdFromClerk(user.clerkUserId);
      if (!discordUserId) {
        summary.skippedNoDiscord += 1;
        continue;
      }

      const existing = await deps.findLinkByProviderUserId("discord", discordUserId);
      if (existing && existing.clerkUserId !== user.clerkUserId) {
        summary.skippedAlreadyLinkedToOther += 1;
        continue;
      }

      await deps.upsertIdentityLink({
        clerkUserId: user.clerkUserId,
        provider: "discord",
        providerUserId: discordUserId,
        status: "linked",
      });
      summary.linked += 1;
    } catch (error: unknown) {
      if (isClerkNotFoundError(error)) {
        summary.skippedMissingClerkUser += 1;
        continue;
      }
      summary.skippedErrors += 1;
      summary.errors.push({
        clerkUserId: user.clerkUserId,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    status: 200,
    body: {
      batch: summary,
      progress: {
        hasMore,
        nextCursor,
      },
    },
  };
}
