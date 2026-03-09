import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/prismaClient";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";

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

type LinkedProfileQueryRow = {
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

type LinkedProfilesHandlerDeps = {
  fetchLinkedProfiles: (discordUserIds: string[]) => Promise<LinkedProfileQueryRow[]>;
  now: () => number;
  cacheTtlMs: number;
  maxCacheEntries: number;
  cacheStore: Map<string, LinkedProfilesCacheEntry>;
};

const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_MAX_CACHE_ENTRIES = 200;
const linkedProfilesCache = new Map<string, LinkedProfilesCacheEntry>();

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

export function createLinkedProfilesHandler(deps: LinkedProfilesHandlerDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const rawDiscordUserIds: unknown[] = Array.isArray(req.body?.discordUserIds)
      ? (req.body.discordUserIds as unknown[])
      : [];
    const discordUserIds: string[] = rawDiscordUserIds.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    if (discordUserIds.length === 0) {
      return res.status(200).json({ links: {} });
    }

    const uniqueIds = Array.from(new Set(discordUserIds)).sort((a, b) => a.localeCompare(b));
    const cacheKey = uniqueIds.join(",");
    const nowMs = deps.now();
    const cached = deps.cacheStore.get(cacheKey);
    if (cached && cached.expiresAt > nowMs) {
      return res.status(200).json(cached.payload);
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
          const className = userCharacter.character.className?.trim();
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

      return res.status(200).json(payload);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error?.message ?? "Failed to load linked profiles." });
    }
  };
}

const handler = createLinkedProfilesHandler({
  fetchLinkedProfiles: async (discordUserIds) =>
    prisma.userIdentityLink.findMany({
      where: {
        provider: "discord",
        status: "linked",
        providerUserId: {
          in: discordUserIds,
        },
        user: {
          name: {
            not: null,
          },
        },
      },
      select: {
        providerUserId: true,
        user: {
          select: {
            name: true,
            characters: {
              select: {
                character: {
                  select: {
                    className: true,
                    realm: true,
                    heraldRealm: true,
                    totalRealmPoints: true,
                    heraldRealmPoints: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  now: () => Date.now(),
  cacheTtlMs: DEFAULT_CACHE_TTL_MS,
  maxCacheEntries: DEFAULT_MAX_CACHE_ENTRIES,
  cacheStore: linkedProfilesCache,
});

export default handler;
