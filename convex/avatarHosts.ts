// Keep in sync with the `images.remotePatterns` hostnames in next.config.js —
// Convex functions run in a separate bundle from the Next app and can't
// import from src/, so this allowlist is necessarily a second copy rather
// than a shared module.
const ALLOWED_AVATAR_HOSTNAMES = [
  "cdn.discordapp.com",
  "media.discordapp.net",
  "cdn.discord.com",
];

/**
 * Drops an avatar url that isn't on a known Discord CDN host. Never throws:
 * this runs against an external bot's payload (or admin input), and a
 * malformed/unexpected avatar url should degrade to "no avatar," not fail
 * the draft-creation or fight-editing mutation it's part of.
 */
export function sanitizeAvatarUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:") return undefined;
  if (!ALLOWED_AVATAR_HOSTNAMES.includes(parsed.hostname)) return undefined;
  return url;
}
