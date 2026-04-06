type ClerkUser = unknown;

type GetCurrentUserDeps = {
  getAuthUserId: () => Promise<string | null>;
  getClerkUser: (userId: string) => Promise<ClerkUser | null>;
};

type GetCurrentUserInput = {
  method: string;
};

type GetCurrentUserApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleGetCurrentUserApi(
  input: GetCurrentUserInput,
  deps: GetCurrentUserDeps
): Promise<GetCurrentUserApiResult> {
  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: "GET" },
      body: `Method ${input.method} Not Allowed`,
      bodyType: "text",
    };
  }

  const userId = await deps.getAuthUserId();
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" }, bodyType: "json" };
  }

  try {
    const user = await deps.getClerkUser(userId);
    if (!user) {
      return { status: 404, body: { error: "User not found" }, bodyType: "json" };
    }
    return { status: 200, body: user, bodyType: "json" };
  } catch (error) {
    if (error instanceof Error) {
      return { status: 500, body: { error: error.message }, bodyType: "json" };
    }
    return { status: 500, body: { error: "Unknown error" }, bodyType: "json" };
  }
}

export type { GetCurrentUserDeps };
