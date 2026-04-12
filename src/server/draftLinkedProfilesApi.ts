import { formatRealmRankWithLevel, getRealmRankForPoints } from "@/utils/character";
import { toCanonicalDraftClassName } from "@/app/draft/constants";

type HighestRankEntry = {
  rank: number;
  formattedRank: string;
};

type LinkedProfileData = {
  profileName: string;
  characterListUrl: string;
  highestRankByClass: Record<string, HighestRankEntry>;
  highestRankByClassRealm: Record<string, HighestRankEntry>;
};

export type LinkedProfileQueryRow = {
  providerUserId: string;
  user: {
    name: string | null;
    characters: Array<{
      character: {
        className: string;
        realm: string;
        heraldRealm: number | null;
        totalRealmPoints: number;
        heraldRealmPoints: number | null;
      };
    }>;
  };
};

type LinkedProfilesPayload = {
  links: Record<string, LinkedProfileData>;
};

type LinkedProfilesCacheEntry = {
  expiresAt: number;
  payload: LinkedProfilesPayload;
};

export type LinkedProfilesApiDeps = {
  fetchLinkedProfiles: (discordUserIds: string[]) => Promise<LinkedProfileQueryRow[]>;
  now: () => number;
  cacheTtlMs: number;
  maxCacheEntries: number;
  cacheStore: Map<string, LinkedProfilesCacheEntry>;
};

export type LinkedProfilesApiInput = {
  method: string;
  body: Record<string, unknown> | null | undefined;
};

type LinkedProfilesApiResult =
  | {
      status: number;
      headers?: Record<string, string | string[]>;
      bodyType: "json";
      body: unknown;
    };

export const DEFAULT_LINKED_PROFILES_CACHE_TTL_MS = 60_000;
export const DEFAULT_LINKED_PROFILES_MAX_CACHE_ENTRIES = 200;

export const linkedProfilesCache = new Map<string, LinkedProfilesCacheEntry>();

function normalizeRealmName(realmName: string | null | undefined, heraldRealm: number | null) {
  const normalized = realmName?.trim().toLowerCase();
  if (normalized === "albion" || normalized === "alb") return "Albion";
  if (normalized === "midgard" || normalized === "mid") return "Midgard";
  if (normalized === "hibernia" || normalized === "hib") return "Hibernia";
  if (heraldRealm === 1) return "Albion";
  if (heraldRealm === 2) return "Midgard";
  if (heraldRealm === 3) return "Hibernia";
  return null;
}

export async function handleLinkedProfilesApi(
  input: LinkedProfilesApiInput,
  deps: LinkedProfilesApiDeps
): Promise<LinkedProfilesApiResult> {
  if (input.method !== "POST") {
    return {
      status: 405,
      bodyType: "json",
      body: { error: "Method not allowed" },
    };
  }

  const rawDiscordUserIds: unknown[] = Array.isArray(input.body?.discordUserIds)
    ? (input.body.discordUserIds as unknown[])
    : [];
  const discordUserIds: string[] = rawDiscordUserIds.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  if (discordUserIds.length === 0) {
    return {
      status: 200,
      bodyType: "json",
      body: { links: {} },
    };
  }

  const uniqueIds = Array.from(new Set(discordUserIds)).sort((a, b) => a.localeCompare(b));
  const cacheKey = uniqueIds.join(",");
  const nowMs = deps.now();
  const cached = deps.cacheStore.get(cacheKey);
  if (cached && cached.expiresAt > nowMs) {
    return {
      status: 200,
      bodyType: "json",
      body: cached.payload,
    };
  }
  if (cached) {
    deps.cacheStore.delete(cacheKey);
  }

  try {
    const links = await deps.fetchLinkedProfiles(uniqueIds);
    const byDiscordUserId: Record<string, LinkedProfileData> = {};

    for (const link of links) {
      const profileName = link.user.name?.trim();
      if (!profileName) continue;
      const highestPointsByClass = new Map<string, number>();
      const highestPointsByClassRealm = new Map<string, number>();
      for (const userCharacter of link.user.characters) {
        const className = toCanonicalDraftClassName(userCharacter.character.className ?? "");
        if (!className) continue;
        const normalizedRealmName = normalizeRealmName(
          userCharacter.character.realm,
          userCharacter.character.heraldRealm
        );
        const points = Math.max(
          userCharacter.character.heraldRealmPoints ?? 0,
          userCharacter.character.totalRealmPoints ?? 0
        );
        const previousPoints = highestPointsByClass.get(className) ?? 0;
        if (points > previousPoints) {
          highestPointsByClass.set(className, points);
        }
        if (normalizedRealmName) {
          const realmClassKey = `${normalizedRealmName}:${className}`;
          const previousRealmPoints = highestPointsByClassRealm.get(realmClassKey) ?? 0;
          if (points > previousRealmPoints) {
            highestPointsByClassRealm.set(realmClassKey, points);
          }
        }
      }
      const highestRankByClass: Record<string, HighestRankEntry> = {};
      highestPointsByClass.forEach((points, className) => {
        const rank = getRealmRankForPoints(points);
        highestRankByClass[className] = {
          rank,
          formattedRank: formatRealmRankWithLevel(rank),
        };
      });
      const highestRankByClassRealm: Record<string, HighestRankEntry> = {};
      highestPointsByClassRealm.forEach((points, realmClassKey) => {
        const rank = getRealmRankForPoints(points);
        highestRankByClassRealm[realmClassKey] = {
          rank,
          formattedRank: formatRealmRankWithLevel(rank),
        };
      });
      byDiscordUserId[link.providerUserId] = {
        profileName,
        characterListUrl: `/user/${encodeURIComponent(profileName)}/characters`,
        highestRankByClass,
        highestRankByClassRealm,
      };
    }

    const payload: LinkedProfilesPayload = { links: byDiscordUserId };
    deps.cacheStore.set(cacheKey, {
      expiresAt: nowMs + deps.cacheTtlMs,
      payload,
    });
    if (deps.cacheStore.size > deps.maxCacheEntries) {
      const oldestKey = deps.cacheStore.keys().next().value;
      if (oldestKey) deps.cacheStore.delete(oldestKey);
    }

    return {
      status: 200,
      bodyType: "json",
      body: payload,
    };
  } catch (error: any) {
    return {
      status: 500,
      bodyType: "json",
      body: { error: error?.message ?? "Failed to load linked profiles." },
    };
  }
}
