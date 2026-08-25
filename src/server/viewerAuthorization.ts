export function isForbiddenViewer(
  viewerClerkUserId: string | null,
  resourceClerkUserId: string | null,
  viewerIsAdmin: boolean
): boolean {
  return viewerClerkUserId !== resourceClerkUserId && !viewerIsAdmin;
}

export async function resolveViewer(
  getAuthUserId: () => Promise<string | null>,
  isAdminClerkUserId: (clerkUserId: string | null) => boolean
): Promise<{ viewerClerkUserId: string | null; viewerIsAdmin: boolean }> {
  const viewerClerkUserId = await getAuthUserId();
  return { viewerClerkUserId, viewerIsAdmin: isAdminClerkUserId(viewerClerkUserId) };
}
