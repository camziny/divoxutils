import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    firstPickTeam: v.optional(v.number()),
    firstRealmPickTeam: v.optional(v.number()),
    pickSequence: v.optional(v.array(v.number())),
    currentPickIndex: v.optional(v.number()),
    banSequence: v.optional(v.array(v.number())),
    currentBanIndex: v.optional(v.number()),
    discordGuildId: v.string(),
    discordChannelId: v.string(),
    discordTextChannelId: v.optional(v.string()),
    createdBy: v.string(),
    winnerTeam: v.optional(v.number()),
    gameStarted: v.optional(v.boolean()),
    botPostedLink: v.optional(v.boolean()),
    botNotifiedCaptains: v.optional(v.boolean()),
  }).index("by_shortId", ["shortId"]),

  draftPlayers: defineTable({
    draftId: v.id("drafts"),
    discordUserId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    team: v.optional(v.number()),
    isCaptain: v.boolean(),
    pickOrder: v.optional(v.number()),
    token: v.string(),
  })
    .index("by_draft", ["draftId"])
    .index("by_token", ["token"]),

  draftBans: defineTable({
    draftId: v.id("drafts"),
    team: v.number(),
    className: v.string(),
  }).index("by_draft", ["draftId"]),

  draftGuildSettings: defineTable({
    discordGuildId: v.string(),
    lobbyChannelId: v.string(),
    team1ChannelId: v.string(),
    team2ChannelId: v.string(),
  }).index("by_guild", ["discordGuildId"]),
});
