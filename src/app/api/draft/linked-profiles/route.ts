import prisma from "../../../../../prisma/prismaClient";
import {
  DEFAULT_LINKED_PROFILES_CACHE_TTL_MS,
  DEFAULT_LINKED_PROFILES_MAX_CACHE_ENTRIES,
  linkedProfilesCache,
  type LinkedProfileQueryRow,
} from "@/server/draftLinkedProfilesApi";
import { createLinkedProfilesRouteHandlers } from "@/server/draftLinkedProfilesRouteHandlers";

const handlers = createLinkedProfilesRouteHandlers({
  deps: {
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
      }) as Promise<LinkedProfileQueryRow[]>,
    now: () => Date.now(),
    cacheTtlMs: DEFAULT_LINKED_PROFILES_CACHE_TTL_MS,
    maxCacheEntries: DEFAULT_LINKED_PROFILES_MAX_CACHE_ENTRIES,
    cacheStore: linkedProfilesCache,
  },
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD;
