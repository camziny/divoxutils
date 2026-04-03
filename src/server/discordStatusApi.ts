export type DiscordStatusApiInput = {
  method: string;
  clerkUserId: string | null;
};

export type DiscordStatusApiDeps = {
  findIdentityLink: (
    clerkUserId: string
  ) => Promise<{ providerUserId: string; status: string } | null>;
  findPendingClaim: (
    clerkUserId: string
  ) => Promise<{ providerUserId: string; status: string } | null>;
  hasDraftRowsForDiscordUserId: (discordUserId: string) => Promise<boolean>;
};

type DiscordStatusApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export async function handleDiscordStatusApi(
  input: DiscordStatusApiInput,
  deps: DiscordStatusApiDeps
): Promise<DiscordStatusApiResult> {
  if (input.method !== "GET") {
    return { status: 405, bodyType: "json", body: { error: "Method not allowed" } };
  }

  if (!input.clerkUserId) {
    return { status: 401, bodyType: "json", body: { error: "Unauthorized" } };
  }

  const link = await deps.findIdentityLink(input.clerkUserId);
  if (link) {
    const hasAnyDraftRowsForLinkedId = await deps.hasDraftRowsForDiscordUserId(
      link.providerUserId
    );
    return {
      status: 200,
      bodyType: "json",
      body: {
        linked: true,
        providerUserId: link.providerUserId,
        status: link.status,
        hasAnyDraftRowsForLinkedId,
        possibleMismatch: !hasAnyDraftRowsForLinkedId,
      },
    };
  }

  const pendingClaim = await deps.findPendingClaim(input.clerkUserId);
  if (pendingClaim) {
    return {
      status: 200,
      bodyType: "json",
      body: {
        linked: false,
        pendingClaim: true,
        providerUserId: pendingClaim.providerUserId,
      },
    };
  }

  return { status: 200, bodyType: "json", body: { linked: false, pendingClaim: false } };
}
