const SEGMENT_SEPARATOR = "~";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function slugifyName(value?: string) {
  const normalized = (value ?? "player")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "player";
}

export function getLeaderboardProfileHref(clerkUserId: string, userName?: string) {
  const slug = slugifyName(userName);
  return `/draft-history/leaderboard/${slug}${SEGMENT_SEPARATOR}${encodeURIComponent(clerkUserId)}`;
}

export function getClerkUserIdFromLeaderboardParam(param: string) {
  const decoded = safeDecode(param);
  const separatorIndex = decoded.indexOf(SEGMENT_SEPARATOR);
  if (separatorIndex === -1) {
    return decoded;
  }
  return decoded.slice(separatorIndex + 1);
}
