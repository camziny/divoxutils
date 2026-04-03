type UserByClerkIdDeps = {
  getUserByClerkUserId: (clerkUserId: string) => Promise<any>;
  getClerkUsername: (clerkUserId: string) => Promise<string | null>;
  updateUser: (id: number, data: unknown) => Promise<any>;
  deleteUser: (id: number) => Promise<unknown>;
};

type UserByClerkIdInput = {
  method: string;
  clerkUserId: string | null;
  idRaw: string | null;
  body: unknown;
};

type UserByClerkIdApiResult =
  | { status: number; headers?: Record<string, string>; bodyType: "json"; body: unknown }
  | { status: number; headers?: Record<string, string>; bodyType: "text"; body: string }
  | { status: number; headers?: Record<string, string>; bodyType: "empty" };

function parseValidId(idRaw: string | null): number | null {
  if (typeof idRaw !== "string") {
    return null;
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function handleUserByClerkIdApi(
  input: UserByClerkIdInput,
  deps: UserByClerkIdDeps
): Promise<UserByClerkIdApiResult> {
  switch (input.method) {
    case "GET":
      try {
        const user = await deps.getUserByClerkUserId(input.clerkUserId as string);
        if (!user) {
          return { status: 404, bodyType: "json", body: { message: "User not found" } };
        }
        const username = await deps.getClerkUsername(input.clerkUserId as string);
        return {
          status: 200,
          bodyType: "json",
          body: {
            ...user,
            username,
          },
        };
      } catch (error) {
        if (error instanceof Error) {
          return { status: 500, bodyType: "json", body: { message: error.message } };
        }
        return {
          status: 500,
          bodyType: "json",
          body: { message: "An unknown error occurred" },
        };
      }
    case "PUT":
      try {
        const id = parseValidId(input.idRaw);
        if (id === null) {
          return { status: 400, bodyType: "json", body: { message: "Invalid id." } };
        }
        const user = await deps.updateUser(id, input.body);
        return { status: 200, bodyType: "json", body: user };
      } catch (error) {
        if (error instanceof Error) {
          return { status: 500, bodyType: "json", body: { message: error.message } };
        }
        return {
          status: 500,
          bodyType: "json",
          body: { message: "An unknown error occurred" },
        };
      }
    case "DELETE":
      try {
        const id = parseValidId(input.idRaw);
        if (id === null) {
          return { status: 400, bodyType: "json", body: { message: "Invalid id." } };
        }
        await deps.deleteUser(id);
        return { status: 204, bodyType: "empty" };
      } catch (error) {
        if (error instanceof Error) {
          return { status: 500, bodyType: "json", body: { message: error.message } };
        }
        return {
          status: 500,
          bodyType: "json",
          body: { message: "An unknown error occurred" },
        };
      }
    default:
      return {
        status: 405,
        headers: { Allow: "GET, PUT, DELETE" },
        bodyType: "text",
        body: `Method ${input.method} Not Allowed`,
      };
  }
}

export type { UserByClerkIdDeps };
