export type PendingClaim = {
  id: number;
  clerkUserId: string;
  provider: string;
  providerUserId: string;
  draftId: string | null;
  status: string;
  createdAt: Date;
};

export type PendingClaimsApiInput = {
  method: string;
  clerkUserId: string | null;
};

export type PendingClaimsApiDeps = {
  isAdminUserId: (userId: string) => boolean;
  listPendingClaims: () => Promise<PendingClaim[]>;
};

type PendingClaimsApiResult = {
  status: number;
  bodyType: "json";
  body: unknown;
};

export async function handlePendingClaimsApi(
  input: PendingClaimsApiInput,
  deps: PendingClaimsApiDeps
): Promise<PendingClaimsApiResult> {
  if (input.method !== "GET") {
    return { status: 405, bodyType: "json", body: { error: "Method not allowed" } };
  }

  if (!input.clerkUserId) {
    return { status: 401, bodyType: "json", body: { error: "Unauthorized" } };
  }

  if (!deps.isAdminUserId(input.clerkUserId)) {
    return { status: 403, bodyType: "json", body: { error: "Forbidden" } };
  }

  const claims = await deps.listPendingClaims();
  return { status: 200, bodyType: "json", body: { claims } };
}
