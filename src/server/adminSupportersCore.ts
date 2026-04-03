type SupporterUser = {
  id: number;
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
  supporterAmount: number;
};

export type AdminSupportersListDeps = {
  isAdminUserId: (userId: string) => boolean;
  findSupporters: () => Promise<SupporterUser[]>;
};

export type AdminSupportersSearchDeps = {
  isAdminUserId: (userId: string) => boolean;
  findUsers: (query: string) => Promise<SupporterUser[]>;
};

export type AdminSupportersUpdateDeps = {
  isAdminUserId: (userId: string) => boolean;
  applySupporterContribution: (args: {
    clerkUserId: string;
    addAmount: number;
  }) => Promise<{ supporterAmount: number; supporterTier: number } | null>;
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

export async function handleAdminSupportersList(
  input: {
    method: string;
    userId: string | null | undefined;
  },
  deps: AdminSupportersListDeps
) {
  if (input.method !== "GET") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  const denied = authError(input.userId, deps.isAdminUserId);
  if (denied) return denied;

  const supporters = await deps.findSupporters();
  return { status: 200, body: { supporters } };
}

export async function handleAdminSupportersSearch(
  input: {
    method: string;
    userId: string | null | undefined;
    queryRaw: unknown;
  },
  deps: AdminSupportersSearchDeps
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

  const users = await deps.findUsers(query);
  return { status: 200, body: { users } };
}

export async function handleAdminSupportersUpdate(
  input: {
    method: string;
    userId: string | null | undefined;
    body: Record<string, unknown>;
  },
  deps: AdminSupportersUpdateDeps
) {
  if (input.method !== "POST") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  const denied = authError(input.userId, deps.isAdminUserId);
  if (denied) return denied;

  const clerkUserId =
    typeof input.body.clerkUserId === "string" ? input.body.clerkUserId.trim() : "";
  const addAmount = Number(input.body.addAmount);

  if (!clerkUserId) {
    return { status: 400, body: { error: "clerkUserId is required." } };
  }

  if (isNaN(addAmount) || addAmount <= 0) {
    return { status: 400, body: { error: "addAmount must be a positive number." } };
  }

  const updated = await deps.applySupporterContribution({
    clerkUserId,
    addAmount,
  });
  if (!updated) {
    return { status: 404, body: { error: "User not found." } };
  }

  return {
    status: 200,
    body: {
      success: true,
      clerkUserId,
      supporterAmount: updated.supporterAmount,
      supporterTier: updated.supporterTier,
    },
  };
}
