export type DeleteUserByClerkUserIdDeps = {
  getUserByClerkUserId: (clerkUserId: string) => Promise<unknown | null>;
  deleteUserByClerkUserId: (clerkUserId: string) => Promise<unknown>;
};

export type DeleteUserByClerkUserIdInput = {
  method: string;
  apiKey: string | null;
  apiSecret: string | undefined;
  clerkUserId: string | null;
};

type DeleteUserByClerkUserIdResult =
  | { status: number; headers?: Record<string, string>; bodyType: "empty" }
  | { status: number; headers?: Record<string, string>; bodyType: "json"; body: unknown }
  | { status: number; headers?: Record<string, string>; bodyType: "text"; body: string };

export async function handleDeleteUserByClerkUserIdApi(
  input: DeleteUserByClerkUserIdInput,
  deps: DeleteUserByClerkUserIdDeps
): Promise<DeleteUserByClerkUserIdResult> {
  if (!input.apiKey || input.apiKey !== input.apiSecret) {
    return {
      status: 401,
      bodyType: "json",
      body: { message: "Invalid or missing API key." },
    };
  }

  if (input.method !== "DELETE") {
    return {
      status: 405,
      headers: { Allow: "DELETE" },
      bodyType: "text",
      body: `Method ${input.method} Not Allowed`,
    };
  }

  if (!input.clerkUserId) {
    return {
      status: 400,
      bodyType: "json",
      body: { message: "Invalid clerkUserId" },
    };
  }

  try {
    const existingUser = await deps.getUserByClerkUserId(input.clerkUserId);
    if (!existingUser) {
      return {
        status: 404,
        bodyType: "json",
        body: { message: "User not found" },
      };
    }

    await deps.deleteUserByClerkUserId(input.clerkUserId);
    return { status: 204, bodyType: "empty" };
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
