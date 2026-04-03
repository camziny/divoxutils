import { NextRequest, NextResponse } from "next/server";
import {
  type AdminAccountDeleteDeps,
  type AdminAccountSearchDeps,
  handleAdminAccountDelete,
  handleAdminAccountSearch,
} from "@/server/adminAccountsCore";

type SearchDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
} & AdminAccountSearchDeps;

type DeleteDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
} & AdminAccountDeleteDeps;

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

export function createAdminAccountSearchRouteHandlers(deps: SearchDeps) {
  async function run(method: string, request: NextRequest) {
    const result = await handleAdminAccountSearch(
      {
        method,
        userId: await deps.getAuthUserId(),
        queryRaw: new URL(request.url).searchParams.get("q"),
      },
      deps
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

export function createAdminAccountDeleteRouteHandlers(deps: DeleteDeps) {
  async function run(method: string, request: NextRequest) {
    if (method !== "POST") {
      const result = await handleAdminAccountDelete(
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
    const result = await handleAdminAccountDelete(
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
