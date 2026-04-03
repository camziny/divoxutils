import { NextRequest, NextResponse } from "next/server";
import {
  type AdminSupportersListDeps,
  type AdminSupportersSearchDeps,
  type AdminSupportersUpdateDeps,
  handleAdminSupportersList,
  handleAdminSupportersSearch,
  handleAdminSupportersUpdate,
} from "@/server/adminSupportersCore";

type ListDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  searchUsers?: never;
} & AdminSupportersListDeps;

type SearchDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  searchUsers: (query: string) => ReturnType<AdminSupportersSearchDeps["findUsers"]>;
} & Omit<AdminSupportersSearchDeps, "findUsers">;

type UpdateDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
} & AdminSupportersUpdateDeps;

async function parseJsonBody(request: NextRequest) {
  try {
    return {
      ok: true as const,
      body: ((await request.json()) ?? {}) as Record<string, unknown>,
    };
  } catch {
    return {
      ok: false as const,
    };
  }
}

export function createAdminSupportersListRouteHandlers(deps: ListDeps) {
  async function run(method: string) {
    const result = await handleAdminSupportersList(
      {
        method,
        userId: await deps.getAuthUserId(),
      },
      deps
    );
    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    GET: async () => run("GET"),
    POST: async () => run("POST"),
    PUT: async () => run("PUT"),
    PATCH: async () => run("PATCH"),
    DELETE: async () => run("DELETE"),
    OPTIONS: async () => run("OPTIONS"),
    HEAD: async () => run("HEAD"),
  };
}

export function createAdminSupportersSearchRouteHandlers(deps: SearchDeps) {
  async function run(method: string, request: NextRequest) {
    const result = await handleAdminSupportersSearch(
      {
        method,
        userId: await deps.getAuthUserId(),
        queryRaw: new URL(request.url).searchParams.get("q"),
      },
      {
        isAdminUserId: deps.isAdminUserId,
        findUsers: deps.searchUsers,
      }
    );
    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    GET: async (request: NextRequest) => run("GET", request),
    POST: async (request: NextRequest) => run("POST", request),
    PUT: async (request: NextRequest) => run("PUT", request),
    PATCH: async (request: NextRequest) => run("PATCH", request),
    DELETE: async (request: NextRequest) => run("DELETE", request),
    OPTIONS: async (request: NextRequest) => run("OPTIONS", request),
    HEAD: async (request: NextRequest) => run("HEAD", request),
  };
}

export function createAdminSupportersUpdateRouteHandlers(deps: UpdateDeps) {
  async function run(method: string, request: NextRequest) {
    if (method !== "POST") {
      const result = await handleAdminSupportersUpdate(
        {
          method,
          userId: await deps.getAuthUserId(),
          body: {},
        },
        deps
      );
      return NextResponse.json(result.body, { status: result.status });
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await handleAdminSupportersUpdate(
      {
        method,
        userId: await deps.getAuthUserId(),
        body: parsed.body,
      },
      deps
    );
    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    POST: async (request: NextRequest) => run("POST", request),
    GET: async (request: NextRequest) => run("GET", request),
    PUT: async (request: NextRequest) => run("PUT", request),
    PATCH: async (request: NextRequest) => run("PATCH", request),
    DELETE: async (request: NextRequest) => run("DELETE", request),
    OPTIONS: async (request: NextRequest) => run("OPTIONS", request),
    HEAD: async (request: NextRequest) => run("HEAD", request),
  };
}
