export type ClaimRecord = {
  id: number;
  clerkUserId: string;
  provider: string;
  providerUserId: string;
  status: string;
};

export type ModerateClaimApiInput = {
  method: string;
  clerkUserId: string | null;
  claimId: number | null;
  action: string | null;
};

export type ModerateClaimApiDeps = {
  isAdminUserId: (userId: string) => boolean;
  findClaimById: (id: number) => Promise<ClaimRecord | null>;
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
  updateClaimReview: (data: {
    claimId: number;
    status: string;
    reviewedByClerkUserId?: string;
  }) => Promise<unknown>;
};

type ModerateClaimApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export async function handleModerateClaimApi(
  input: ModerateClaimApiInput,
  deps: ModerateClaimApiDeps
): Promise<ModerateClaimApiResult> {
  if (!input.clerkUserId) {
    return { status: 401, bodyType: "json", body: { error: "Unauthorized" } };
  }

  if (!deps.isAdminUserId(input.clerkUserId)) {
    return { status: 403, bodyType: "json", body: { error: "Forbidden" } };
  }

  if (input.method !== "POST") {
    return { status: 405, bodyType: "json", body: { error: "Method not allowed" } };
  }

  if (!Number.isInteger(input.claimId) || (input.claimId as number) <= 0) {
    return {
      status: 400,
      bodyType: "json",
      body: { error: "claimId must be a positive integer." },
    };
  }

  const normalizedAction =
    typeof input.action === "string" ? input.action.trim().toLowerCase() : "";
  if (normalizedAction !== "approve" && normalizedAction !== "reject") {
    return {
      status: 400,
      bodyType: "json",
      body: { error: "action must be approve or reject." },
    };
  }

  const claim = await deps.findClaimById(input.claimId as number);
  if (!claim) {
    return { status: 404, bodyType: "json", body: { error: "Claim not found." } };
  }

  if (claim.status !== "pending") {
    return { status: 409, bodyType: "json", body: { error: "Claim is not pending." } };
  }

  if (normalizedAction === "approve") {
    const existingLink = await deps.findIdentityLinkByProviderUserId(
      claim.provider,
      claim.providerUserId
    );
    if (existingLink && existingLink.clerkUserId !== claim.clerkUserId) {
      return {
        status: 409,
        bodyType: "json",
        body: { error: "Cannot approve claim because identity is linked to another account." },
      };
    }

    await deps.upsertIdentityLink({
      clerkUserId: claim.clerkUserId,
      provider: claim.provider,
      providerUserId: claim.providerUserId,
      status: "linked",
    });

    await deps.updateClaimReview({
      claimId: input.claimId as number,
      status: "approved",
      reviewedByClerkUserId: input.clerkUserId,
    });

    return {
      status: 200,
      bodyType: "json",
      body: { success: true, claimId: input.claimId, status: "approved" },
    };
  }

  await deps.updateClaimReview({
    claimId: input.claimId as number,
    status: "rejected",
    reviewedByClerkUserId: input.clerkUserId,
  });

  return {
    status: 200,
    bodyType: "json",
    body: { success: true, claimId: input.claimId, status: "rejected" },
  };
}
