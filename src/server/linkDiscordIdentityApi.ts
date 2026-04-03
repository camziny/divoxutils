export type LinkDiscordIdentityApiInput = {
  method: string;
  clerkUserId: string | null;
  bodyDiscordUserId: string | null;
};

export type LinkDiscordIdentityApiDeps = {
  resolveDiscordUserIdFromClerk: (clerkUserId: string) => Promise<string | null>;
  findLocalUserByClerkId: (clerkUserId: string) => Promise<{ clerkUserId: string } | null>;
  findIdentityLinkByProviderUserId: (
    provider: string,
    providerUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  upsertIdentityLink: (data: {
    clerkUserId: string;
    provider: string;
    providerUserId: string;
    status: string;
  }) => Promise<unknown>;
};

type LinkDiscordIdentityApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export function getDiscordExternalAccountId(clerkUser: any): string | null {
  const externalAccounts = Array.isArray(clerkUser?.externalAccounts)
    ? clerkUser.externalAccounts
    : [];

  for (const account of externalAccounts) {
    const provider = String(account?.provider ?? account?.providerId ?? "").toLowerCase();
    if (!provider.includes("discord")) {
      continue;
    }
    const id =
      (typeof account?.externalId === "string" && account.externalId.trim()) ||
      (typeof account?.providerUserId === "string" && account.providerUserId.trim()) ||
      "";
    if (id) {
      return id;
    }
  }

  return null;
}

export async function handleLinkDiscordIdentityApi(
  input: LinkDiscordIdentityApiInput,
  deps: LinkDiscordIdentityApiDeps
): Promise<LinkDiscordIdentityApiResult> {
  if (input.method !== "POST") {
    return { status: 405, bodyType: "json", body: { error: "Method not allowed" } };
  }

  if (!input.clerkUserId) {
    return { status: 401, bodyType: "json", body: { error: "Unauthorized" } };
  }

  const localUser = await deps.findLocalUserByClerkId(input.clerkUserId);
  if (!localUser) {
    return { status: 404, bodyType: "json", body: { error: "User not found." } };
  }

  const bodyDiscordUserId =
    typeof input.bodyDiscordUserId === "string" ? input.bodyDiscordUserId.trim() : "";
  const discordUserId =
    bodyDiscordUserId || (await deps.resolveDiscordUserIdFromClerk(input.clerkUserId));

  if (!discordUserId) {
    return {
      status: 400,
      bodyType: "json",
      body: { error: "Unable to determine Discord user id for this account." },
    };
  }

  const existingLink = await deps.findIdentityLinkByProviderUserId("discord", discordUserId);
  if (existingLink && existingLink.clerkUserId !== input.clerkUserId) {
    return {
      status: 409,
      bodyType: "json",
      body: { error: "Discord user is already linked to another account." },
    };
  }

  await deps.upsertIdentityLink({
    clerkUserId: input.clerkUserId,
    provider: "discord",
    providerUserId: discordUserId,
    status: "linked",
  });

  return {
    status: 200,
    bodyType: "json",
    body: {
      success: true,
      clerkUserId: input.clerkUserId,
      provider: "discord",
      providerUserId: discordUserId,
      status: "linked",
    },
  };
}
