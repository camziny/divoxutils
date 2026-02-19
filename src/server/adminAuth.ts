export function getAdminClerkUserIds() {
  const combined = [
    process.env.ADMIN_CLERK_USER_IDS ?? "",
    process.env.ADMIN_CLERK_USER_ID ?? "",
  ]
    .filter(Boolean)
    .join(",");

  return combined
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminClerkUserId(userId: string | null | undefined) {
  if (!userId) {
    return false;
  }
  return getAdminClerkUserIds().includes(userId);
}
