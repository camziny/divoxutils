export type ClaimDiscordIdentityApiInput = {
  method: string;
  clerkUserId: string | null;
  bodyDiscordUserId: string | null;
  bodyDraftId: string | null;
};

export type ClaimDiscordIdentityApiDeps = {
  findLocalUserByClerkId: (clerkUserId: string) => Promise<{ clerkUserId: string } | null>;
  findIdentityLinkByProviderUserId: (
    provider: string,
    providerUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  findPendingClaim: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
  }) => Promise<{ id: number } | null>;
  createClaim: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
    draftId?: string;
    status: string;
  }) => Promise<{ id: number; status: string }>;
};

type ClaimDiscordIdentityApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export async function handleClaimDiscordIdentityApi(
  input: ClaimDiscordIdentityApiInput,
  deps: ClaimDiscordIdentityApiDeps
): Promise<ClaimDiscordIdentityApiResult> {
  if (input.method !== "POST") {
    return { status: 405, bodyType: "json", body: { error: "Method not allowed" } };
  }

  if (!input.clerkUserId) {
    return { status: 401, bodyType: "json", body: { error: "Unauthorized" } };
  }

  const discordUserId =
    typeof input.bodyDiscordUserId === "string" ? input.bodyDiscordUserId.trim() : "";
  const draftId =
    typeof input.bodyDraftId === "string" && input.bodyDraftId.trim()
      ? input.bodyDraftId.trim()
      : undefined;

  if (!discordUserId) {
    return { status: 400, bodyType: "json", body: { error: "discordUserId is required." } };
  }

  const localUser = await deps.findLocalUserByClerkId(input.clerkUserId);
  if (!localUser) {
    return { status: 404, bodyType: "json", body: { error: "User not found." } };
  }

  const existingLink = await deps.findIdentityLinkByProviderUserId("discord", discordUserId);
  if (existingLink && existingLink.clerkUserId !== input.clerkUserId) {
    return {
      status: 409,
      bodyType: "json",
      body: { error: "Discord user is already linked to another account." },
    };
  }

  const pendingClaim = await deps.findPendingClaim({
    clerkUserId: input.clerkUserId,
    provider: "discord",
    providerUserId: discordUserId,
  });
  if (pendingClaim) {
    return {
      status: 409,
      bodyType: "json",
      body: { error: "A pending claim already exists." },
    };
  }

  const claim = await deps.createClaim({
    clerkUserId: input.clerkUserId,
    provider: "discord",
    providerUserId: discordUserId,
    draftId,
    status: "pending",
  });

  return {
    status: 201,
    bodyType: "json",
    body: {
      success: true,
      claimId: claim.id,
      clerkUserId: input.clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      status: claim.status,
    },
  };
}
