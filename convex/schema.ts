import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const teamNumber = v.union(v.literal(1), v.literal(2));

export default defineSchema({
  drafts: defineTable({
    shortId: v.string(),
    type: v.union(v.literal("traditional"), v.literal("pvp")),
    status: v.union(
      v.literal("setup"),
      v.literal("coin_flip"),
      v.literal("realm_pick"),
      v.literal("banning"),
      v.literal("drafting"),
      v.literal("complete")
    ),
    teamSize: v.number(),
    coinFlipWinnerId: v.optional(v.string()),
    coinFlipChoice: v.optional(v.string()),
    team1Realm: v.optional(v.string()),
    team2Realm: v.optional(v.string()),
    team1CaptainId: v.optional(v.string()),
    team2CaptainId: v.optional(v.string()),
    firstPickTeam: v.optional(teamNumber),
    firstRealmPickTeam: v.optional(teamNumber),
    pickSequence: v.optional(v.array(teamNumber)),
    currentPickIndex: v.optional(v.number()),
    banSequence: v.optional(v.array(teamNumber)),
    currentBanIndex: v.optional(v.number()),
    discordGuildId: v.string(),
    discordGuildName: v.optional(v.string()),
    discordChannelId: v.string(),
    discordTextChannelId: v.optional(v.string()),
    createdBy: v.string(),
    createdByDisplayName: v.optional(v.string()),
    createdByAvatarUrl: v.optional(v.string()),
    winnerTeam: v.optional(teamNumber),
    gameStarted: v.optional(v.boolean()),
    resultStatus: v.optional(
      v.union(
        v.literal("unverified"),
        v.literal("verified"),
        v.literal("voided")
      )
    ),
    resultModeratedBy: v.optional(v.string()),
    resultModeratedAt: v.optional(v.number()),
    resultModerationNote: v.optional(v.string()),
    botPostedLink: v.optional(v.boolean()),
    botNotifiedCaptains: v.optional(v.boolean()),
  })
    .index("by_shortId", ["shortId"])
    .index("by_status", ["status"]),

  draftPlayers: defineTable({
    draftId: v.id("drafts"),
    discordUserId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    team: v.optional(teamNumber),
    isCaptain: v.boolean(),
    pickOrder: v.optional(v.number()),
    token: v.string(),
  })
    .index("by_draft", ["draftId"])
    .index("by_token", ["token"]),

  draftBans: defineTable({
    draftId: v.id("drafts"),
    team: teamNumber,
    className: v.string(),
  }).index("by_draft", ["draftId"]),

  draftGuildSettings: defineTable({
    discordGuildId: v.string(),
    lobbyChannelId: v.string(),
    team1ChannelId: v.string(),
    team2ChannelId: v.string(),
  }).index("by_guild", ["discordGuildId"]),
});
