import { NextRequest, NextResponse } from "next/server";
import {
  type CharactersSearchApiDeps,
  handleCharactersSearchApi,
} from "@/server/charactersSearchApi";

type CharactersSearchRouteDeps = {
  deps: CharactersSearchApiDeps;
};

export function createCharactersSearchRouteHandlers(routeDeps: CharactersSearchRouteDeps) {
  async function run(method: string, request: NextRequest) {
    const url = new URL(request.url);
    const result = await handleCharactersSearchApi(
      {
        method,
        name: url.searchParams.get("name"),
        cluster: url.searchParams.get("cluster"),
      },
      routeDeps.deps
    );

    if (result.bodyType === "text") {
      const response = new NextResponse(result.body, { status: result.status });
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        });
      }
      return response;
    }

    const response = NextResponse.json(result.body, { status: result.status });
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        response.headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      });
    }
    return response;
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
