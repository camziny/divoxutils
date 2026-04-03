export type DraftClassLeaderboardApiInput = {
  method: string;
  className: string | null;
};

export type DraftClassLeaderboardApiDeps = {
  getClassDraftStats: (className: string) => Promise<unknown>;
};

type DraftClassLeaderboardApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export async function handleDraftClassLeaderboardApi(
  input: DraftClassLeaderboardApiInput,
  deps: DraftClassLeaderboardApiDeps
): Promise<DraftClassLeaderboardApiResult> {
  if (input.method !== "GET") {
    return {
      status: 405,
      bodyType: "json",
      body: { error: "Method not allowed" },
    };
  }

  const className = typeof input.className === "string" ? input.className.trim() : "";
  if (!className) {
    return {
      status: 400,
      bodyType: "json",
      body: { error: "Missing className" },
    };
  }

  try {
    const rows = await deps.getClassDraftStats(className);
    return {
      status: 200,
      bodyType: "json",
      body: { rows },
    };
  } catch (error: unknown) {
    return {
      status: 500,
      bodyType: "json",
      body: {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Failed to load class leaderboard.",
      },
    };
  }
}
