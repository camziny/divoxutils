import { NextRequest, NextResponse } from "next/server";

type JsonObject = Record<string, unknown>;

type ApiResult = {
  status: number;
  body: JsonObject;
};

type RequestLike = {
  method?: string;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => {
    json: (payload: unknown) => unknown;
  };
};

type RouteAuthDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
};

type LegacyAuthDeps = {
  getAuthUserId: (req: RequestLike) => string | null;
};

export type AdminDraftsDeps = {
  isAdminUserId: (userId: string) => boolean;
  purgeExpiredCancelledDrafts: () => Promise<unknown>;
  listPendingDrafts: () => Promise<unknown>;
  listReviewedDrafts: () => Promise<unknown>;
  listCancelableDrafts: () => Promise<unknown>;
  listCancelledDrafts: () => Promise<unknown>;
};

export type AdminDraftFightsDeps = {
  isAdminUserId: (userId: string) => boolean;
  replaceDraftFights: (args: {
    shortId: string;
    fights: Array<{
      winnerTeam: 1 | 2;
      classesByPlayer: Array<{
        playerId: string;
        className: string;
        substituteMode?: "known" | "manual";
        substituteDiscordUserId?: string;
        substituteDisplayName?: string;
        substituteAvatarUrl?: string;
      }>;
    }>;
    submittedBy: string;
  }) => Promise<unknown>;
};

export type CancelDraftDeps = {
  isAdminUserId: (userId: string) => boolean;
  cancelDraft: (args: {
    shortId: string;
    cancelledByClerkUserId: string;
    reason?: string;
  }) => Promise<unknown>;
};

export type RestoreDraftDeps = {
  isAdminUserId: (userId: string) => boolean;
  restoreDraft: (args: {
    shortId: string;
    restoredByClerkUserId: string;
  }) => Promise<unknown>;
};

export type ModerateAction = "verify" | "void" | "override_team_1" | "override_team_2";

export type ModerateDraftDeps = {
  isAdminUserId: (userId: string) => boolean;
  moderateDraftResult: (args: {
    shortId: string;
    action: ModerateAction;
    moderatedByClerkUserId: string;
    note?: string;
  }) => Promise<unknown>;
};

function toBody(rawBody: unknown): JsonObject {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return {};
  }
  return rawBody as JsonObject;
}

async function parseJsonBody(request: NextRequest) {
  try {
    const body = await request.json();
    return { ok: true as const, body: toBody(body) };
  } catch {
    return { ok: false as const };
  }
}

function unauthorized() {
  return { status: 401, body: { error: "Unauthorized" } };
}

function forbidden() {
  return { status: 403, body: { error: "Forbidden" } };
}

function methodNotAllowed() {
  return { status: 405, body: { error: "Method not allowed" } };
}

function parseFightPayload(rawFights: unknown) {
  if (!Array.isArray(rawFights) || rawFights.length === 0) {
    return { error: "At least one fight is required." as const };
  }

  const fights: Array<{
    winnerTeam: 1 | 2;
    classesByPlayer: Array<{
      playerId: string;
      className: string;
      substituteMode?: "known" | "manual";
      substituteDiscordUserId?: string;
      substituteDisplayName?: string;
      substituteAvatarUrl?: string;
    }>;
  }> = [];

  for (const rawFight of rawFights) {
    if (!rawFight || typeof rawFight !== "object") {
      return { error: "Invalid fight payload." as const };
    }
    const winnerTeam = (rawFight as { winnerTeam?: unknown }).winnerTeam;
    if (winnerTeam !== 1 && winnerTeam !== 2) {
      return { error: "Each fight winner must be Team 1 or Team 2." as const };
    }
    const rawClasses = (rawFight as { classesByPlayer?: unknown }).classesByPlayer;
    if (!Array.isArray(rawClasses) || rawClasses.length === 0) {
      return { error: "Each fight must include at least one class entry." as const };
    }

    const classesByPlayer: Array<{
      playerId: string;
      className: string;
      substituteMode?: "known" | "manual";
      substituteDiscordUserId?: string;
      substituteDisplayName?: string;
      substituteAvatarUrl?: string;
    }> = [];

    for (const rawEntry of rawClasses) {
      if (!rawEntry || typeof rawEntry !== "object") {
        return { error: "Invalid class entry payload." as const };
      }
      const playerId =
        typeof (rawEntry as { playerId?: unknown }).playerId === "string"
          ? (rawEntry as { playerId: string }).playerId.trim()
          : "";
      const className =
        typeof (rawEntry as { className?: unknown }).className === "string"
          ? (rawEntry as { className: string }).className.trim()
          : "";
      if (!playerId || !className) {
        return { error: "Each class entry requires playerId and className." as const };
      }

      const substituteModeRaw = (rawEntry as { substituteMode?: unknown }).substituteMode;
      const substituteMode =
        substituteModeRaw === "known" || substituteModeRaw === "manual"
          ? substituteModeRaw
          : undefined;
      const substituteDiscordUserId =
        typeof (rawEntry as { substituteDiscordUserId?: unknown }).substituteDiscordUserId ===
        "string"
          ? (rawEntry as { substituteDiscordUserId: string }).substituteDiscordUserId.trim()
          : "";
      const substituteDisplayName =
        typeof (rawEntry as { substituteDisplayName?: unknown }).substituteDisplayName ===
        "string"
          ? (rawEntry as { substituteDisplayName: string }).substituteDisplayName.trim()
          : "";
      const substituteAvatarUrl =
        typeof (rawEntry as { substituteAvatarUrl?: unknown }).substituteAvatarUrl === "string"
          ? (rawEntry as { substituteAvatarUrl: string }).substituteAvatarUrl.trim()
          : "";

      if (substituteMode === "known") {
        if (!substituteDiscordUserId || !substituteDisplayName) {
          return {
            error:
              "Known substitute entries require substituteDiscordUserId and substituteDisplayName." as const,
          };
        }
      } else if (substituteMode === "manual") {
        if (!substituteDisplayName) {
          return {
            error: "Manual substitute entries require substituteDisplayName." as const,
          };
        }
        if (substituteDiscordUserId) {
          return {
            error: "Manual substitute entries cannot include substituteDiscordUserId." as const,
          };
        }
        if (substituteAvatarUrl) {
          return {
            error: "Manual substitute entries cannot include substituteAvatarUrl." as const,
          };
        }
      } else if (substituteDiscordUserId || substituteDisplayName || substituteAvatarUrl) {
        return {
          error: "substituteMode is required when substitute fields are provided." as const,
        };
      }

      const normalizedEntry: {
        playerId: string;
        className: string;
        substituteMode?: "known" | "manual";
        substituteDiscordUserId?: string;
        substituteDisplayName?: string;
        substituteAvatarUrl?: string;
      } = {
        playerId,
        className,
      };
      if (substituteMode === "known") {
        normalizedEntry.substituteMode = "known";
        normalizedEntry.substituteDiscordUserId = substituteDiscordUserId;
        normalizedEntry.substituteDisplayName = substituteDisplayName;
        if (substituteAvatarUrl) {
          normalizedEntry.substituteAvatarUrl = substituteAvatarUrl;
        }
      }
      if (substituteMode === "manual") {
        normalizedEntry.substituteMode = "manual";
        normalizedEntry.substituteDisplayName = substituteDisplayName;
      }
      classesByPlayer.push(normalizedEntry);
    }

    fights.push({ winnerTeam, classesByPlayer });
  }

  return { fights };
}

export async function handleAdminDraftsApi(
  input: {
    method: string;
    userId: string | null;
  },
  deps: AdminDraftsDeps
): Promise<ApiResult> {
  if (input.method !== "GET") {
    return methodNotAllowed();
  }
  if (!input.userId) {
    return unauthorized();
  }
  if (!deps.isAdminUserId(input.userId)) {
    return forbidden();
  }

  try {
    let purgeWarning: string | undefined;
    try {
      await deps.purgeExpiredCancelledDrafts();
    } catch (error: any) {
      purgeWarning = error?.message
        ? `Archive cleanup skipped: ${error.message}`
        : "Archive cleanup skipped.";
    }

    const [pendingDrafts, reviewedDrafts, cancelableDrafts, cancelledDrafts] = await Promise.all([
      deps.listPendingDrafts(),
      deps.listReviewedDrafts(),
      deps.listCancelableDrafts(),
      deps.listCancelledDrafts(),
    ]);

    return {
      status: 200,
      body: {
        pendingDrafts,
        reviewedDrafts,
        cancelableDrafts,
        cancelledDrafts,
        ...(purgeWarning ? { purgeWarning } : {}),
      },
    };
  } catch (error: any) {
    return { status: 500, body: { error: error?.message ?? "Failed to fetch drafts." } };
  }
}

export async function handleAdminDraftFightsApi(
  input: {
    method: string;
    userId: string | null;
    body: JsonObject;
  },
  deps: AdminDraftFightsDeps
): Promise<ApiResult> {
  if (input.method !== "POST") {
    return methodNotAllowed();
  }
  if (!input.userId) {
    return unauthorized();
  }
  if (!deps.isAdminUserId(input.userId)) {
    return forbidden();
  }

  const shortId = typeof input.body.shortId === "string" ? input.body.shortId.trim() : "";
  const parsedFights = parseFightPayload(input.body.fights);
  if (!shortId) {
    return { status: 400, body: { error: "shortId is required." } };
  }
  if ("error" in parsedFights) {
    return { status: 400, body: { error: parsedFights.error } };
  }

  try {
    await deps.replaceDraftFights({
      shortId,
      fights: parsedFights.fights,
      submittedBy: input.userId,
    });
    return { status: 200, body: { success: true } };
  } catch (error: any) {
    return { status: 500, body: { error: error?.message ?? "Failed to update draft fights." } };
  }
}

export async function handleCancelDraftApi(
  input: {
    method: string;
    userId: string | null;
    body: JsonObject;
  },
  deps: CancelDraftDeps
): Promise<ApiResult> {
  if (input.method !== "POST") {
    return methodNotAllowed();
  }
  if (!input.userId) {
    return unauthorized();
  }
  if (!deps.isAdminUserId(input.userId)) {
    return forbidden();
  }

  const shortId = typeof input.body.shortId === "string" ? input.body.shortId.trim() : "";
  const reason =
    typeof input.body.reason === "string" && input.body.reason.trim()
      ? input.body.reason.trim()
      : undefined;
  if (!shortId) {
    return { status: 400, body: { error: "shortId is required." } };
  }

  try {
    const result = await deps.cancelDraft({
      shortId,
      cancelledByClerkUserId: input.userId,
      reason,
    });
    return { status: 200, body: { success: true, result } };
  } catch (error: any) {
    return { status: 500, body: { error: error?.message ?? "Failed to cancel draft." } };
  }
}

export async function handleRestoreDraftApi(
  input: {
    method: string;
    userId: string | null;
    body: JsonObject;
  },
  deps: RestoreDraftDeps
): Promise<ApiResult> {
  if (input.method !== "POST") {
    return methodNotAllowed();
  }
  if (!input.userId) {
    return unauthorized();
  }
  if (!deps.isAdminUserId(input.userId)) {
    return forbidden();
  }

  const shortId = typeof input.body.shortId === "string" ? input.body.shortId.trim() : "";
  if (!shortId) {
    return { status: 400, body: { error: "shortId is required." } };
  }

  try {
    const result = await deps.restoreDraft({
      shortId,
      restoredByClerkUserId: input.userId,
    });
    return { status: 200, body: { success: true, result } };
  } catch (error: any) {
    return { status: 500, body: { error: error?.message ?? "Failed to restore draft." } };
  }
}

export async function handleModerateDraftApi(
  input: {
    method: string;
    userId: string | null;
    body: JsonObject;
  },
  deps: ModerateDraftDeps
): Promise<ApiResult> {
  if (input.method !== "POST") {
    return methodNotAllowed();
  }
  if (!input.userId) {
    return unauthorized();
  }
  if (!deps.isAdminUserId(input.userId)) {
    return forbidden();
  }

  const shortId = typeof input.body.shortId === "string" ? input.body.shortId.trim() : "";
  const action = typeof input.body.action === "string" ? input.body.action.trim() : "";
  const note =
    typeof input.body.note === "string" && input.body.note.trim()
      ? input.body.note.trim()
      : undefined;

  if (!shortId) {
    return { status: 400, body: { error: "shortId is required." } };
  }
  if (!["verify", "void", "override_team_1", "override_team_2"].includes(action)) {
    return {
      status: 400,
      body: {
        error: "action must be verify, void, override_team_1, or override_team_2.",
      },
    };
  }

  try {
    const result = await deps.moderateDraftResult({
      shortId,
      action: action as ModerateAction,
      moderatedByClerkUserId: input.userId,
      note,
    });
    return { status: 200, body: { success: true, result } };
  } catch (error: any) {
    return { status: 500, body: { error: error?.message ?? "Failed to moderate draft." } };
  }
}

export function createAdminDraftsHandler(deps: LegacyAuthDeps & AdminDraftsDeps) {
  return async (req: RequestLike, res: ResponseLike) => {
    const result = await handleAdminDraftsApi(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createAdminDraftFightsHandler(deps: LegacyAuthDeps & AdminDraftFightsDeps) {
  return async (req: RequestLike, res: ResponseLike) => {
    const result = await handleAdminDraftFightsApi(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        body: toBody(req.body),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createCancelDraftHandler(deps: LegacyAuthDeps & CancelDraftDeps) {
  return async (req: RequestLike, res: ResponseLike) => {
    const result = await handleCancelDraftApi(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        body: toBody(req.body),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createRestoreDraftHandler(deps: LegacyAuthDeps & RestoreDraftDeps) {
  return async (req: RequestLike, res: ResponseLike) => {
    const result = await handleRestoreDraftApi(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        body: toBody(req.body),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createModerateDraftHandler(deps: LegacyAuthDeps & ModerateDraftDeps) {
  return async (req: RequestLike, res: ResponseLike) => {
    const result = await handleModerateDraftApi(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        body: toBody(req.body),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createAdminDraftsRouteHandlers(deps: RouteAuthDeps & AdminDraftsDeps) {
  async function run(method: string) {
    const result = await handleAdminDraftsApi(
      {
        method,
        userId: await deps.getAuthUserId(),
      },
      deps
    );
    return NextResponse.json(result.body, { status: result.status });
  }

  return {
    GET: async (_request: NextRequest) => run("GET"),
    POST: async (_request: NextRequest) => run("POST"),
    PUT: async (_request: NextRequest) => run("PUT"),
    PATCH: async (_request: NextRequest) => run("PATCH"),
    DELETE: async (_request: NextRequest) => run("DELETE"),
    OPTIONS: async (_request: NextRequest) => run("OPTIONS"),
    HEAD: async (_request: NextRequest) => run("HEAD"),
  };
}

export function createAdminDraftFightsRouteHandlers(deps: RouteAuthDeps & AdminDraftFightsDeps) {
  async function run(method: string, request: NextRequest) {
    let body: JsonObject = {};
    if (method === "POST") {
      const parsed = await parseJsonBody(request);
      if (!parsed.ok) {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
      body = parsed.body;
    }

    const result = await handleAdminDraftFightsApi(
      {
        method,
        userId: await deps.getAuthUserId(),
        body,
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

export function createCancelDraftRouteHandlers(deps: RouteAuthDeps & CancelDraftDeps) {
  async function run(method: string, request: NextRequest) {
    let body: JsonObject = {};
    if (method === "POST") {
      const parsed = await parseJsonBody(request);
      if (!parsed.ok) {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
      body = parsed.body;
    }

    const result = await handleCancelDraftApi(
      {
        method,
        userId: await deps.getAuthUserId(),
        body,
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

export function createRestoreDraftRouteHandlers(deps: RouteAuthDeps & RestoreDraftDeps) {
  async function run(method: string, request: NextRequest) {
    let body: JsonObject = {};
    if (method === "POST") {
      const parsed = await parseJsonBody(request);
      if (!parsed.ok) {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
      body = parsed.body;
    }

    const result = await handleRestoreDraftApi(
      {
        method,
        userId: await deps.getAuthUserId(),
        body,
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

export function createModerateDraftRouteHandlers(deps: RouteAuthDeps & ModerateDraftDeps) {
  async function run(method: string, request: NextRequest) {
    let body: JsonObject = {};
    if (method === "POST") {
      const parsed = await parseJsonBody(request);
      if (!parsed.ok) {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
      body = parsed.body;
    }

    const result = await handleModerateDraftApi(
      {
        method,
        userId: await deps.getAuthUserId(),
        body,
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
