import { NextRequest, NextResponse } from "next/server";
import {
  type AdminIdentityBackfillDeps,
  handleAdminIdentityBackfill,
} from "@/server/adminIdentityBackfillCore";

type AdminIdentityBackfillRouteDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
} & AdminIdentityBackfillDeps;

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

export function createAdminIdentityBackfillRouteHandlers(deps: AdminIdentityBackfillRouteDeps) {
  async function run(method: string, request: NextRequest) {
    if (method !== "POST") {
      const result = await handleAdminIdentityBackfill(
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

    const result = await handleAdminIdentityBackfill(
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
