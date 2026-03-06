import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { classesByRealm, allClasses, REALMS } from "./constants";
import { Id } from "./_generated/dataModel";

function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().slice(0, 12);
}

function generatePickSequence(
  teamSize: number,
  firstPickTeam: 1 | 2,
  mode: "snake" | "alternating" = "snake"
): (1 | 2)[] {
  const totalPicks = (teamSize - 1) * 2;
  const secondPickTeam: 1 | 2 = firstPickTeam === 1 ? 2 : 1;
  const sequence: (1 | 2)[] = [];

  if (mode === "alternating") {
    let currentTeam: 1 | 2 = firstPickTeam;
    while (sequence.length < totalPicks) {
      sequence.push(currentTeam);
      currentTeam = currentTeam === 1 ? 2 : 1;
    }
    return sequence;
  }

  sequence.push(firstPickTeam);
  if (sequence.length < totalPicks) sequence.push(secondPickTeam);
  if (sequence.length < totalPicks) sequence.push(secondPickTeam);

  let currentTeam: 1 | 2 = firstPickTeam;
  while (sequence.length < totalPicks) {
    sequence.push(currentTeam);
    currentTeam = currentTeam === 1 ? 2 : 1;
  }

  return sequence;
}

const MAX_FIGHTS = 5;
const REQUIRED_WINS = 3;
const STALE_DRAFT_NO_PROGRESS_MS = 30 * 60 * 1000;
const STALE_DRAFT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function buildSetScore(team1Wins: number, team2Wins: number): string {
  return `${team1Wins}-${team2Wins}`;
}

function isSetFinalized(draft: {
  setFinalizedAt?: number;
  setFinalizedBy?: string;
}): boolean {
  return draft.setFinalizedAt !== undefined || draft.setFinalizedBy !== undefined;
}

async function recomputeDraftScoreFromFights(
  ctx: any,
  draftId: Id<"drafts">
): Promise<{
  team1Wins: number;
  team2Wins: number;
  setScore: string;
  pendingWinnerTeam: 1 | 2 | undefined;
}> {
  const fights = await ctx.db
    .query("draftFights")
    .withIndex("by_draft", (q: any) => q.eq("draftId", draftId))
    .collect();
  const team1Wins = fights.filter((fight: any) => fight.winnerTeam === 1).length;
  const team2Wins = fights.filter((fight: any) => fight.winnerTeam === 2).length;
  const pendingWinnerTeam =
    team1Wins >= REQUIRED_WINS ? 1 : team2Wins >= REQUIRED_WINS ? 2 : undefined;
  return {
    team1Wins,
    team2Wins,
    setScore: buildSetScore(team1Wins, team2Wins),
    pendingWinnerTeam,
  };
}

export const getDraft = query({
  args: { shortId: v.string() },
  handler: async (ctx, { shortId }) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();

    if (!draft) return null;

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();

    const bans = await ctx.db
      .query("draftBans")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();
    const fights = await ctx.db
      .query("draftFights")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();

    const sanitizedPlayers = players.map(({ token, ...rest }) => rest);

    return {
      ...draft,
      players: sanitizedPlayers,
      bans,
      fights: fights.sort((a, b) => a.fightNumber - b.fightNumber),
    };
  },
});

export const getDraftStatus = query({
  args: { shortId: v.string() },
  handler: async (ctx, { shortId }) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();

    if (!draft) return null;

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();

    return {
      status: draft.status,
      gameStarted: draft.gameStarted,
      winnerTeam: draft.winnerTeam,
      pendingWinnerTeam: draft.pendingWinnerTeam,
      setFinalizedAt: draft.setFinalizedAt,
      setFinalizedBy: draft.setFinalizedBy,
      discordGuildId: draft.discordGuildId,
      discordGuildName: draft.discordGuildName,
      createdBy: draft.createdBy,
      createdByDisplayName: draft.createdByDisplayName,
      createdByAvatarUrl: draft.createdByAvatarUrl,
      discordTextChannelId: draft.discordTextChannelId,
      team1CaptainId: draft.team1CaptainId,
      team2CaptainId: draft.team2CaptainId,
      botPostedLink: draft.botPostedLink,
      botNotifiedCaptains: draft.botNotifiedCaptains,
      players: players.map((p) => ({
        discordUserId: p.discordUserId,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        team: p.team,
      })),
    };
  },
});

export const getPlayerByToken = query({
  args: { token: v.string(), shortId: v.optional(v.string()) },
  handler: async (ctx, { shortId, token }) => {
    const player = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!player) return null;
    if (shortId) {
      const draft = await ctx.db
        .query("drafts")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
      if (!draft || player.draftId !== draft._id) return null;
    }
    return player;
  },
});

export const createDraft = mutation({
  args: {
    discordGuildId: v.string(),
    discordGuildName: v.optional(v.string()),
    discordChannelId: v.string(),
    discordTextChannelId: v.optional(v.string()),
    createdBy: v.string(),
    createdByDisplayName: v.optional(v.string()),
    createdByAvatarUrl: v.optional(v.string()),
    players: v.array(
      v.object({
        discordUserId: v.string(),
        displayName: v.string(),
        avatarUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const defaultTeamSize = Math.min(
      8,
      Math.max(2, Math.floor(args.players.length / 2))
    );

    let shortId = generateShortId();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await ctx.db
        .query("drafts")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
      if (!existing) break;
      shortId = generateShortId();
      if (attempt === 4) throw new Error("Failed to generate unique draft ID");
    }

    const draftId = await ctx.db.insert("drafts", {
      shortId,
      type: "traditional",
      status: "setup",
      teamSize: defaultTeamSize,
      pickOrderMode: "snake",
      discordGuildId: args.discordGuildId,
      discordGuildName: args.discordGuildName,
      discordChannelId: args.discordChannelId,
      discordTextChannelId: args.discordTextChannelId,
      createdBy: args.createdBy,
      createdByDisplayName: args.createdByDisplayName,
      createdByAvatarUrl: args.createdByAvatarUrl,
    });

    const playerTokens: { discordUserId: string; token: string }[] = [];

    for (const player of args.players) {
      const token = generateToken();
      await ctx.db.insert("draftPlayers", {
        draftId,
        discordUserId: player.discordUserId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        isCaptain: false,
        token,
      });
      playerTokens.push({ discordUserId: player.discordUserId, token });
    }

    return { draftId, shortId, playerTokens };
  },
});

export const assignCaptain = mutation({
  args: {
    draftId: v.id("drafts"),
    discordUserId: v.string(),
    team: v.union(v.literal(1), v.literal(2)),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "setup") throw new Error("Draft is not in setup phase");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can assign captains");
    }

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();

    const targetPlayer = players.find(
      (p) => p.discordUserId === args.discordUserId
    );
    if (!targetPlayer) throw new Error("Player not found");

    const otherTeamCaptainId =
      args.team === 1 ? draft.team2CaptainId : draft.team1CaptainId;
    if (args.discordUserId === otherTeamCaptainId) {
      throw new Error("This player is already captain of the other team");
    }

    const prevCaptainId =
      args.team === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    if (prevCaptainId) {
      const prevCaptain = players.find(
        (p) => p.discordUserId === prevCaptainId
      );
      if (prevCaptain) {
        await ctx.db.patch(prevCaptain._id, {
          isCaptain: false,
          team: undefined,
        });
      }
    }

    await ctx.db.patch(targetPlayer._id, {
      isCaptain: true,
      team: args.team,
    });

    const updates: Record<string, string> = {};
    if (args.team === 1) {
      updates.team1CaptainId = args.discordUserId;
    } else {
      updates.team2CaptainId = args.discordUserId;
    }

    await ctx.db.patch(args.draftId, updates);
  },
});

export const updateSettings = mutation({
  args: {
    draftId: v.id("drafts"),
    type: v.union(v.literal("traditional"), v.literal("pvp")),
    teamSize: v.number(),
    pickOrderMode: v.optional(
      v.union(v.literal("snake"), v.literal("alternating"))
    ),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "setup") throw new Error("Draft is not in setup phase");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can update settings");
    }

    if (args.teamSize < 2 || args.teamSize > 8)
      throw new Error("Team size must be between 2 and 8");

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();

    if (players.length < args.teamSize * 2) {
      throw new Error(
        `Need at least ${args.teamSize * 2} players for ${args.teamSize}v${args.teamSize}`
      );
    }

    await ctx.db.patch(args.draftId, {
      type: args.type,
      teamSize: args.teamSize,
      pickOrderMode: args.pickOrderMode ?? draft.pickOrderMode ?? "snake",
    });
  },
});

export const startDraft = mutation({
  args: {
    draftId: v.id("drafts"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can start the draft");
    }

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();

    if (draft.status === "setup") {
      if (!draft.team1CaptainId || !draft.team2CaptainId) {
        throw new Error("Both captains must be assigned");
      }
      if (players.length < draft.teamSize * 2) {
        throw new Error(`Need at least ${draft.teamSize * 2} players`);
      }

      await ctx.db.patch(args.draftId, {
        status: "coin_flip",
        coinFlipWinnerId: undefined,
        coinFlipChoice: undefined,
        firstPickTeam: undefined,
        firstRealmPickTeam: undefined,
      });
      return;
    }

    if (draft.status !== "coin_flip") {
      throw new Error("Draft is not ready for coin flip");
    }
    if (draft.coinFlipWinnerId) {
      throw new Error("Coin flip has already happened");
    }
    if (!draft.team1CaptainId || !draft.team2CaptainId) {
      throw new Error("Both captains must be assigned");
    }
    if (players.length < draft.teamSize * 2) {
      throw new Error(`Need at least ${draft.teamSize * 2} players`);
    }

    const coinFlipWinnerId =
      Math.random() < 0.5 ? draft.team1CaptainId : draft.team2CaptainId;

    await ctx.db.patch(args.draftId, {
      coinFlipWinnerId,
    });
  },
});

export const setCoinFlipChoice = mutation({
  args: {
    draftId: v.id("drafts"),
    choice: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "coin_flip")
      throw new Error("Not in coin flip phase");
    if (!draft.coinFlipWinnerId) {
      throw new Error("Coin flip has not happened yet");
    }

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.coinFlipWinnerId
    ) {
      throw new Error("Only the coin flip winner can make this choice");
    }

    const winnerTeam: 1 | 2 =
      draft.coinFlipWinnerId === draft.team1CaptainId ? 1 : 2;
    const loserTeam: 1 | 2 = winnerTeam === 1 ? 2 : 1;

    let firstPickTeam: 1 | 2;
    let firstRealmPickTeam: 1 | 2 | undefined;
    let nextStatus: "realm_pick" | "banning";

    if (draft.type === "traditional") {
      if (args.choice !== "realm_first" && args.choice !== "player_first") {
        throw new Error("Invalid choice for traditional draft");
      }
      if (args.choice === "realm_first") {
        firstRealmPickTeam = winnerTeam;
        firstPickTeam = loserTeam;
      } else {
        firstRealmPickTeam = loserTeam;
        firstPickTeam = winnerTeam;
      }
      nextStatus = "realm_pick";
    } else {
      if (args.choice !== "pick_first" && args.choice !== "pick_second") {
        throw new Error("Invalid choice for PvP draft");
      }
      firstPickTeam = args.choice === "pick_first" ? winnerTeam : loserTeam;
      nextStatus = "banning";
    }

    const banFirstTeam: 1 | 2 = firstPickTeam === 1 ? 2 : 1;
    const banSecondTeam: 1 | 2 = firstPickTeam;
    const banSequence: (1 | 2)[] = [
      banFirstTeam,
      banSecondTeam,
      banFirstTeam,
      banSecondTeam,
    ];

    await ctx.db.patch(args.draftId, {
      status: nextStatus,
      coinFlipChoice: args.choice,
      firstPickTeam,
      firstRealmPickTeam,
      banSequence,
      currentBanIndex: 0,
    });
  },
});

export const pickRealm = mutation({
  args: {
    draftId: v.id("drafts"),
    realm: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "realm_pick")
      throw new Error("Not in realm pick phase");

    if (!REALMS.includes(args.realm as (typeof REALMS)[number])) {
      throw new Error("Invalid realm");
    }

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!callerPlayer || callerPlayer.draftId !== args.draftId) {
      throw new Error("Invalid token for this draft");
    }

    const team1HasRealm = !!draft.team1Realm;
    const team2HasRealm = !!draft.team2Realm;

    if (team1HasRealm && team2HasRealm) {
      throw new Error("Both realms already picked");
    }

    let currentRealmPickTeam: number;
    if (!team1HasRealm && !team2HasRealm) {
      currentRealmPickTeam = draft.firstRealmPickTeam!;
    } else {
      currentRealmPickTeam = draft.firstRealmPickTeam === 1 ? 2 : 1;
    }

    const expectedCaptainId =
      currentRealmPickTeam === 1
        ? draft.team1CaptainId
        : draft.team2CaptainId;
    if (callerPlayer.discordUserId !== expectedCaptainId) {
      throw new Error("Not your turn to pick realm");
    }

    if (draft.team1Realm === args.realm || draft.team2Realm === args.realm) {
      throw new Error("Realm already taken");
    }

    const updates: Record<string, string> = {};
    if (currentRealmPickTeam === 1) {
      updates.team1Realm = args.realm;
    } else {
      updates.team2Realm = args.realm;
    }

    const updatedTeam1Realm =
      currentRealmPickTeam === 1 ? args.realm : draft.team1Realm;
    const updatedTeam2Realm =
      currentRealmPickTeam === 2 ? args.realm : draft.team2Realm;

    if (updatedTeam1Realm && updatedTeam2Realm) {
      await ctx.db.patch(args.draftId, { ...updates, status: "banning" });
    } else {
      await ctx.db.patch(args.draftId, updates);
    }
  },
});

export const banClass = mutation({
  args: {
    draftId: v.id("drafts"),
    className: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "banning") throw new Error("Not in banning phase");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!callerPlayer || callerPlayer.draftId !== args.draftId) {
      throw new Error("Invalid token for this draft");
    }

    const currentBanTeam = draft.banSequence![draft.currentBanIndex!];
    const expectedCaptainId =
      currentBanTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;

    if (callerPlayer.discordUserId !== expectedCaptainId) {
      throw new Error("Not your turn to ban");
    }

    if (draft.type === "traditional") {
      const opponentRealm =
        currentBanTeam === 1 ? draft.team2Realm! : draft.team1Realm!;
      const realmClasses = classesByRealm[opponentRealm];
      if (!realmClasses || !realmClasses.includes(args.className)) {
        throw new Error(
          `${args.className} is not a valid ${opponentRealm} class`
        );
      }
    } else {
      const baseName = args.className.replace(/\s*\((?:Alb|Mid|Hib)\)$/, "");
      if (!allClasses.includes(baseName)) {
        throw new Error(`${args.className} is not a valid class`);
      }
    }

    const existingBans = await ctx.db
      .query("draftBans")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();

    if (draft.type === "traditional") {
      if (
        existingBans.some(
          (b) => b.team === currentBanTeam && b.className === args.className
        )
      ) {
        throw new Error("You already banned this class");
      }
    } else {
      if (existingBans.some((b) => b.className === args.className)) {
        throw new Error("Class is already banned");
      }
    }

    await ctx.db.insert("draftBans", {
      draftId: args.draftId,
      team: currentBanTeam,
      className: args.className,
    });

    const nextBanIndex = draft.currentBanIndex! + 1;

    if (nextBanIndex >= draft.banSequence!.length) {
      const pickSequence = generatePickSequence(
        draft.teamSize,
        draft.firstPickTeam!,
        draft.pickOrderMode ?? "snake"
      );
      await ctx.db.patch(args.draftId, {
        status: "drafting",
        currentBanIndex: nextBanIndex,
        pickSequence,
        currentPickIndex: 0,
      });
    } else {
      await ctx.db.patch(args.draftId, {
        currentBanIndex: nextBanIndex,
      });
    }
  },
});

export const pickPlayer = mutation({
  args: {
    draftId: v.id("drafts"),
    playerId: v.id("draftPlayers"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "drafting") throw new Error("Not in drafting phase");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!callerPlayer || callerPlayer.draftId !== args.draftId) {
      throw new Error("Invalid token for this draft");
    }

    const currentPickTeam = draft.pickSequence![draft.currentPickIndex!];
    const expectedCaptainId =
      currentPickTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;

    if (callerPlayer.discordUserId !== expectedCaptainId) {
      throw new Error("Not your turn to pick");
    }

    const targetPlayer = await ctx.db.get(args.playerId);
    if (!targetPlayer) throw new Error("Target player not found");
    if (targetPlayer.draftId !== args.draftId)
      throw new Error("Player not in this draft");
    if (targetPlayer.team !== undefined)
      throw new Error("Player already on a team");
    if (targetPlayer.isCaptain) throw new Error("Cannot pick a captain");

    await ctx.db.patch(args.playerId, {
      team: currentPickTeam,
      pickOrder: draft.currentPickIndex! + 1,
    });

    const nextPickIndex = draft.currentPickIndex! + 1;

    if (nextPickIndex >= draft.pickSequence!.length) {
      await ctx.db.patch(args.draftId, {
        status: "complete",
        currentPickIndex: nextPickIndex,
      });
    } else {
      await ctx.db.patch(args.draftId, {
        currentPickIndex: nextPickIndex,
      });
    }
  },
});

export const setPlayerClass = mutation({
  args: {
    draftId: v.id("drafts"),
    playerId: v.id("draftPlayers"),
    className: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "drafting" && draft.status !== "complete") {
      throw new Error("Classes can only be set after drafting starts");
    }

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!callerPlayer || callerPlayer.draftId !== args.draftId) {
      throw new Error("Invalid token for this draft");
    }

    if (!allClasses.includes(args.className)) {
      throw new Error("Invalid class");
    }

    const targetPlayer = await ctx.db.get(args.playerId);
    if (!targetPlayer || targetPlayer.draftId !== args.draftId) {
      throw new Error("Player not found");
    }
    if (targetPlayer.team === undefined) {
      throw new Error("Player is not on a team");
    }

    const callerTeam =
      callerPlayer.discordUserId === draft.team1CaptainId
        ? 1
        : callerPlayer.discordUserId === draft.team2CaptainId
          ? 2
          : undefined;
    if (!callerTeam) {
      throw new Error("Only captains can set classes");
    }
    if (targetPlayer.team !== callerTeam) {
      throw new Error("Captains can only set classes for their own team");
    }

    await ctx.db.patch(args.playerId, { selectedClass: args.className });
  },
});

export const recordFightResult = mutation({
  args: {
    draftId: v.id("drafts"),
    winnerTeam: v.union(v.literal(1), v.literal(2)),
    classesByPlayer: v.array(
      v.object({
        playerId: v.id("draftPlayers"),
        className: v.string(),
      })
    ),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Draft is not complete");
    if (!draft.gameStarted) throw new Error("Game has not started");
    if (isSetFinalized(draft)) throw new Error("Set is already finalized");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can record fights");
    }

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();
    const draftedPlayers = players.filter((p) => p.team !== undefined);

    if (draftedPlayers.length === 0) {
      throw new Error("No drafted players found");
    }
    if (args.classesByPlayer.length !== draftedPlayers.length) {
      throw new Error("Classes must include every drafted player");
    }

    const classByPlayerId = new Map(
      args.classesByPlayer.map((entry) => [entry.playerId, entry.className])
    );
    const seenPlayerIds = new Set(args.classesByPlayer.map((entry) => entry.playerId));
    if (seenPlayerIds.size !== args.classesByPlayer.length) {
      throw new Error("Duplicate player class entries are not allowed");
    }

    const normalizedClassesByPlayer: {
      playerId: typeof draftedPlayers[number]["_id"];
      discordUserId: string;
      className: string;
    }[] = [];

    for (const player of draftedPlayers) {
      const className = classByPlayerId.get(player._id);
      if (!className) {
        throw new Error("Missing class entry for a drafted player");
      }
      if (!allClasses.includes(className)) {
        throw new Error(`Invalid class: ${className}`);
      }
      normalizedClassesByPlayer.push({
        playerId: player._id,
        discordUserId: player.discordUserId,
        className,
      });
    }

    const existingFights = await ctx.db
      .query("draftFights")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();
    const nextFightNumber = existingFights.length + 1;

    if (nextFightNumber > MAX_FIGHTS) {
      throw new Error("Maximum fights already recorded");
    }

    const team1WinsBefore = existingFights.filter((fight) => fight.winnerTeam === 1).length;
    const team2WinsBefore = existingFights.filter((fight) => fight.winnerTeam === 2).length;
    if (team1WinsBefore >= REQUIRED_WINS || team2WinsBefore >= REQUIRED_WINS) {
      throw new Error("Set is already complete");
    }

    await ctx.db.insert("draftFights", {
      draftId: args.draftId,
      fightNumber: nextFightNumber,
      winnerTeam: args.winnerTeam,
      classesByPlayer: normalizedClassesByPlayer,
      submittedBy: callerPlayer.discordUserId,
    });

    for (const entry of normalizedClassesByPlayer) {
      await ctx.db.patch(entry.playerId, { selectedClass: entry.className });
    }

    const team1Wins = team1WinsBefore + (args.winnerTeam === 1 ? 1 : 0);
    const team2Wins = team2WinsBefore + (args.winnerTeam === 2 ? 1 : 0);
    const pendingWinnerTeam =
      team1Wins >= REQUIRED_WINS ? 1 : team2Wins >= REQUIRED_WINS ? 2 : undefined;

    await ctx.db.patch(args.draftId, {
      team1FightWins: team1Wins,
      team2FightWins: team2Wins,
      setScore: buildSetScore(team1Wins, team2Wins),
      pendingWinnerTeam,
    });
  },
});

export const updateFightWinner = mutation({
  args: {
    draftId: v.id("drafts"),
    fightNumber: v.number(),
    winnerTeam: v.union(v.literal(1), v.literal(2)),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Draft is not complete");
    if (!draft.gameStarted) throw new Error("Game has not started");
    if (isSetFinalized(draft)) throw new Error("Set is already finalized");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can edit fight winners");
    }

    const fight = await ctx.db
      .query("draftFights")
      .withIndex("by_draft_fight", (q) =>
        q.eq("draftId", args.draftId).eq("fightNumber", args.fightNumber)
      )
      .unique();
    if (!fight) throw new Error("Fight not found");

    await ctx.db.patch(fight._id, { winnerTeam: args.winnerTeam });

    const recomputed = await recomputeDraftScoreFromFights(ctx, args.draftId);
    await ctx.db.patch(args.draftId, {
      team1FightWins: recomputed.team1Wins,
      team2FightWins: recomputed.team2Wins,
      setScore: recomputed.setScore,
      pendingWinnerTeam: recomputed.pendingWinnerTeam,
    });
  },
});

export const finalizeSetResult = mutation({
  args: {
    draftId: v.id("drafts"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Draft is not complete");
    if (!draft.gameStarted) throw new Error("Game has not started");
    if (isSetFinalized(draft)) throw new Error("Set is already finalized");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can finalize the set");
    }

    const recomputed = await recomputeDraftScoreFromFights(ctx, args.draftId);
    const winnerToFinalize = draft.pendingWinnerTeam ?? recomputed.pendingWinnerTeam;
    if (winnerToFinalize === undefined) {
      throw new Error("Set winner is not ready to finalize");
    }

    const now = Date.now();
    await ctx.db.patch(args.draftId, {
      winnerTeam: winnerToFinalize,
      pendingWinnerTeam: winnerToFinalize,
      setFinalizedAt: now,
      setFinalizedBy: callerPlayer.discordUserId,
      team1FightWins: recomputed.team1Wins,
      team2FightWins: recomputed.team2Wins,
      setScore: recomputed.setScore,
      resultStatus: "unverified",
      resultModeratedBy: undefined,
      resultModeratedAt: undefined,
      resultModerationNote: undefined,
      winnerOverriddenBy: undefined,
      winnerOverriddenAt: undefined,
      winnerOverrideNote: undefined,
    });
  },
});

export const beginGame = mutation({
  args: {
    draftId: v.id("drafts"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Draft is not complete");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can begin the game");
    }

    await ctx.db.patch(args.draftId, {
      gameStarted: true,
    });
  },
});

export const undoLastAction = mutation({
  args: {
    draftId: v.id("drafts"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can undo");
    }

    if (draft.status === "complete" && !draft.gameStarted) {
      const lastPickIndex = draft.currentPickIndex! - 1;
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
        .collect();
      const lastPicked = players.find(
        (p) => p.pickOrder === draft.currentPickIndex
      );
      if (lastPicked) {
        await ctx.db.patch(lastPicked._id, {
          team: undefined,
          pickOrder: undefined,
        });
      }
      await ctx.db.patch(args.draftId, {
        status: "drafting",
        currentPickIndex: lastPickIndex,
      });
      return;
    }

    if (draft.status === "drafting") {
      if (draft.currentPickIndex === 0) {
        const bans = await ctx.db
          .query("draftBans")
          .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
          .collect();
        if (bans.length > 0) {
          const lastBan = bans[bans.length - 1];
          await ctx.db.delete(lastBan._id);
          await ctx.db.patch(args.draftId, {
            status: "banning",
            currentBanIndex: draft.banSequence!.length - 1,
            pickSequence: undefined,
            currentPickIndex: undefined,
          });
        }
        return;
      }

      const prevPickIndex = draft.currentPickIndex! - 1;
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
        .collect();
      const lastPicked = players.find(
        (p) => p.pickOrder === draft.currentPickIndex
      );
      if (lastPicked) {
        await ctx.db.patch(lastPicked._id, {
          team: undefined,
          pickOrder: undefined,
        });
      }
      await ctx.db.patch(args.draftId, {
        currentPickIndex: prevPickIndex,
      });
      return;
    }

    if (draft.status === "banning") {
      const bans = await ctx.db
        .query("draftBans")
        .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
        .collect();
      if (bans.length === 0) {
        if (draft.type === "traditional") {
          const secondRealmTeam = draft.firstRealmPickTeam === 1 ? 2 : 1;
          const realmToClear = secondRealmTeam === 1 ? "team1Realm" : "team2Realm";
          await ctx.db.patch(args.draftId, {
            status: "realm_pick",
            [realmToClear]: undefined,
            currentBanIndex: undefined,
          });
        } else {
          await ctx.db.patch(args.draftId, {
            status: "coin_flip",
            coinFlipChoice: undefined,
            firstPickTeam: undefined,
            banSequence: undefined,
            currentBanIndex: undefined,
          });
        }
        return;
      }
      const lastBan = bans[bans.length - 1];
      await ctx.db.delete(lastBan._id);
      await ctx.db.patch(args.draftId, {
        currentBanIndex: draft.currentBanIndex! - 1,
      });
      return;
    }

    if (draft.status === "realm_pick") {
      const hasAnyRealm = !!draft.team1Realm || !!draft.team2Realm;
      if (!hasAnyRealm) {
        await ctx.db.patch(args.draftId, {
          status: "coin_flip",
          coinFlipChoice: undefined,
          firstPickTeam: undefined,
          firstRealmPickTeam: undefined,
          banSequence: undefined,
          currentBanIndex: undefined,
        });
      } else {
        const realmToClear =
          draft.firstRealmPickTeam === 1 ? "team1Realm" : "team2Realm";
        await ctx.db.patch(args.draftId, {
          [realmToClear]: undefined,
        });
      }
      return;
    }

    throw new Error("Nothing to undo in current phase");
  },
});

export const setWinner = mutation({
  args: {
    draftId: v.id("drafts"),
    winnerTeam: v.union(v.literal(1), v.literal(2)),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Draft is not complete");

    const callerPlayer = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (
      !callerPlayer ||
      callerPlayer.draftId !== args.draftId ||
      callerPlayer.discordUserId !== draft.createdBy
    ) {
      throw new Error("Only the draft creator can set the winner");
    }

    await ctx.db.patch(args.draftId, {
      winnerTeam: args.winnerTeam,
      pendingWinnerTeam: args.winnerTeam,
      setFinalizedAt: Date.now(),
      setFinalizedBy: callerPlayer.discordUserId,
      resultStatus: "unverified",
      resultModeratedBy: undefined,
      resultModeratedAt: undefined,
      resultModerationNote: undefined,
    });
  },
});

export const adminReplaceDraftFights = mutation({
  args: {
    shortId: v.string(),
    fights: v.array(
      v.object({
        winnerTeam: v.union(v.literal(1), v.literal(2)),
        classesByPlayer: v.array(
          v.object({
            playerId: v.id("draftPlayers"),
            className: v.string(),
            substituteMode: v.optional(v.union(v.literal("known"), v.literal("manual"))),
            substituteDiscordUserId: v.optional(v.string()),
            substituteDisplayName: v.optional(v.string()),
            substituteAvatarUrl: v.optional(v.string()),
          })
        ),
      })
    ),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "complete") throw new Error("Only completed drafts can be edited");

    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();
    const draftedPlayers = players.filter((p) => p.team !== undefined);
    const playerById = new Map(players.map((p) => [p._id, p]));

    if (args.fights.length === 0) throw new Error("At least one fight is required");
    if (args.fights.length > MAX_FIGHTS) throw new Error("Too many fights");

    const existingFights = await ctx.db
      .query("draftFights")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();
    for (const fight of existingFights) {
      await ctx.db.delete(fight._id);
    }

    let team1Wins = 0;
    let team2Wins = 0;

    for (let index = 0; index < args.fights.length; index += 1) {
      const fight = args.fights[index];
      if (fight.classesByPlayer.length !== draftedPlayers.length) {
        throw new Error("Each fight must include classes for all drafted players");
      }
      const seenPlayerIds = new Set(
        fight.classesByPlayer.map((entry) => entry.playerId)
      );
      if (seenPlayerIds.size !== fight.classesByPlayer.length) {
        throw new Error("Duplicate player class entries are not allowed");
      }

      const classByPlayerId = new Map(
        fight.classesByPlayer.map((entry) => [entry.playerId, entry.className])
      );
      const entryByPlayerId = new Map(
        fight.classesByPlayer.map((entry) => [entry.playerId, entry])
      );
      const normalizedClassesByPlayer: {
        playerId: typeof draftedPlayers[number]["_id"];
        discordUserId: string;
        className: string;
        substituteMode?: "known" | "manual";
        substituteDiscordUserId?: string;
        substituteDisplayName?: string;
        substituteAvatarUrl?: string;
      }[] = [];

      for (const draftedPlayer of draftedPlayers) {
        const className = classByPlayerId.get(draftedPlayer._id);
        if (!className) throw new Error("Missing player class assignment");
        if (!allClasses.includes(className)) throw new Error(`Invalid class: ${className}`);
        const classEntry = entryByPlayerId.get(draftedPlayer._id);
        if (!classEntry) throw new Error("Missing player class assignment");

        const normalizedClassName = className.trim();
        if (!normalizedClassName) throw new Error("Player class cannot be empty");

        const substituteMode = classEntry.substituteMode;
        const substituteDiscordUserId = classEntry.substituteDiscordUserId?.trim();
        const substituteDisplayName = classEntry.substituteDisplayName?.trim();
        const substituteAvatarUrl = classEntry.substituteAvatarUrl?.trim();

        if (substituteMode === "known") {
          if (!substituteDiscordUserId) {
            throw new Error("Known substitute requires a discord user id");
          }
          if (!substituteDisplayName) {
            throw new Error("Known substitute requires a display name");
          }
        } else if (substituteMode === "manual") {
          if (!substituteDisplayName) {
            throw new Error("Manual substitute requires a display name");
          }
          if (substituteDiscordUserId) {
            throw new Error("Manual substitute cannot include a discord user id");
          }
          if (substituteAvatarUrl) {
            throw new Error("Manual substitute cannot include an avatar url");
          }
        } else if (substituteDiscordUserId || substituteDisplayName || substituteAvatarUrl) {
          throw new Error("Substitute mode is required when substitute details are provided");
        }

        normalizedClassesByPlayer.push({
          playerId: draftedPlayer._id,
          discordUserId: draftedPlayer.discordUserId,
          className: normalizedClassName,
          substituteMode: substituteMode ?? undefined,
          substituteDiscordUserId:
            substituteMode === "known" ? substituteDiscordUserId : undefined,
          substituteDisplayName:
            substituteMode === "known" || substituteMode === "manual"
              ? substituteDisplayName
              : undefined,
          substituteAvatarUrl: substituteMode === "known" ? substituteAvatarUrl : undefined,
        });
      }

      await ctx.db.insert("draftFights", {
        draftId: draft._id,
        fightNumber: index + 1,
        winnerTeam: fight.winnerTeam,
        classesByPlayer: normalizedClassesByPlayer,
        submittedBy: args.submittedBy,
      });

      if (fight.winnerTeam === 1) team1Wins += 1;
      else team2Wins += 1;
      if (
        index < args.fights.length - 1 &&
        (team1Wins >= REQUIRED_WINS || team2Wins >= REQUIRED_WINS)
      ) {
        throw new Error("Cannot record fights after set is complete");
      }
    }

    const finalWinnerTeam =
      team1Wins >= REQUIRED_WINS ? 1 : team2Wins >= REQUIRED_WINS ? 2 : undefined;
    if (!finalWinnerTeam) {
      throw new Error("At least one team must reach 3 wins");
    }

    const lastFight = args.fights[args.fights.length - 1];
    for (const classEntry of lastFight.classesByPlayer) {
      const player = playerById.get(classEntry.playerId);
      if (player) {
        await ctx.db.patch(player._id, { selectedClass: classEntry.className });
      }
    }

    await ctx.db.patch(draft._id, {
      winnerTeam: finalWinnerTeam,
      pendingWinnerTeam: finalWinnerTeam,
      setFinalizedAt: Date.now(),
      setFinalizedBy: args.submittedBy,
      team1FightWins: team1Wins,
      team2FightWins: team2Wins,
      setScore: buildSetScore(team1Wins, team2Wins),
      resultStatus: "unverified",
      resultModeratedBy: undefined,
      resultModeratedAt: undefined,
      resultModerationNote: undefined,
      winnerOverriddenBy: undefined,
      winnerOverriddenAt: undefined,
      winnerOverrideNote: undefined,
    });
  },
});

export const getDraftsForModeration = query({
  args: {},
  handler: async (ctx) => {
    const completedDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();

    const pending = completedDrafts.filter(
      (draft) =>
        draft.winnerTeam !== undefined &&
        (draft.resultStatus === undefined || draft.resultStatus === "unverified")
    );

    const results = [];
    for (const draft of pending) {
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const fights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        winnerTeam: draft.winnerTeam,
        createdBy: draft.createdBy,
        createdByDisplayName: draft.createdByDisplayName,
        createdByAvatarUrl: draft.createdByAvatarUrl,
        resultStatus: draft.resultStatus ?? "unverified",
        team1FightWins: draft.team1FightWins ?? 0,
        team2FightWins: draft.team2FightWins ?? 0,
        setScore:
          draft.setScore ??
          buildSetScore(
            draft.team1FightWins ?? 0,
            draft.team2FightWins ?? 0
          ),
        _creationTime: draft._creationTime,
        fights: fights
          .sort((a, b) => a.fightNumber - b.fightNumber)
          .map((fight) => ({
            fightNumber: fight.fightNumber,
            winnerTeam: fight.winnerTeam,
            classesByPlayer: fight.classesByPlayer,
          })),
        players: players.map((p) => ({
          _id: p._id,
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
          selectedClass: p.selectedClass,
        })),
      });
    }

    return results.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getReviewedDraftsForModeration = query({
  args: {},
  handler: async (ctx) => {
    const completedDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();

    const reviewed = completedDrafts.filter(
      (draft) =>
        draft.winnerTeam !== undefined &&
        (draft.resultStatus === "verified" || draft.resultStatus === "voided")
    );

    const results = [];
    for (const draft of reviewed) {
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const fights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        winnerTeam: draft.winnerTeam,
        createdBy: draft.createdBy,
        createdByDisplayName: draft.createdByDisplayName,
        createdByAvatarUrl: draft.createdByAvatarUrl,
        resultStatus: draft.resultStatus,
        resultModeratedAt: draft.resultModeratedAt,
        resultModeratedBy: draft.resultModeratedBy,
        team1FightWins: draft.team1FightWins ?? 0,
        team2FightWins: draft.team2FightWins ?? 0,
        setScore:
          draft.setScore ??
          buildSetScore(
            draft.team1FightWins ?? 0,
            draft.team2FightWins ?? 0
          ),
        _creationTime: draft._creationTime,
        fights: fights
          .sort((a, b) => a.fightNumber - b.fightNumber)
          .map((fight) => ({
            fightNumber: fight.fightNumber,
            winnerTeam: fight.winnerTeam,
            classesByPlayer: fight.classesByPlayer,
          })),
        players: players.map((p) => ({
          _id: p._id,
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
          selectedClass: p.selectedClass,
        })),
      });
    }

    return results.sort((a, b) => b._creationTime - a._creationTime).slice(0, 50);
  },
});

export const getVerifiedDraftResults = query({
  args: {},
  handler: async (ctx) => {
    const completedDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();

    const verified = completedDrafts.filter(
      (draft) => draft.winnerTeam !== undefined && draft.resultStatus === "verified"
    );

    const results = [];
    for (const draft of verified) {
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const fights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        type: draft.type,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        winnerTeam: draft.winnerTeam,
        resultStatus: draft.resultStatus,
        team1FightWins: draft.team1FightWins ?? 0,
        team2FightWins: draft.team2FightWins ?? 0,
        setScore:
          draft.setScore ??
          buildSetScore(
            draft.team1FightWins ?? 0,
            draft.team2FightWins ?? 0
          ),
        _creationTime: draft._creationTime,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        fights: fights
          .sort((a, b) => a.fightNumber - b.fightNumber)
          .map((fight) => ({
            fightNumber: fight.fightNumber,
            winnerTeam: fight.winnerTeam,
            classesByPlayer: fight.classesByPlayer,
          })),
        players: players.map((p) => ({
          _id: p._id,
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
          selectedClass: p.selectedClass,
        })),
      });
    }

    return results.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getCompletedDraftResults = query({
  args: {},
  handler: async (ctx) => {
    const completedDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();

    const results = [];
    for (const draft of completedDrafts) {
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const bans = await ctx.db
        .query("draftBans")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const fights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        type: draft.type,
        teamSize: draft.teamSize,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        createdBy: draft.createdBy,
        createdByDisplayName: draft.createdByDisplayName,
        createdByAvatarUrl: draft.createdByAvatarUrl,
        winnerTeam: draft.winnerTeam,
        resultStatus: draft.resultStatus ?? "unverified",
        team1FightWins: draft.team1FightWins ?? 0,
        team2FightWins: draft.team2FightWins ?? 0,
        setScore:
          draft.setScore ??
          buildSetScore(
            draft.team1FightWins ?? 0,
            draft.team2FightWins ?? 0
          ),
        _creationTime: draft._creationTime,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        fights: fights
          .sort((a, b) => a.fightNumber - b.fightNumber)
          .map((fight) => ({
            fightNumber: fight.fightNumber,
            winnerTeam: fight.winnerTeam,
            classesByPlayer: fight.classesByPlayer,
          })),
        players: players.map((p) => ({
          _id: p._id,
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
          selectedClass: p.selectedClass,
        })),
        bans: bans.map((b) => ({
          team: b.team,
          className: b.className,
        })),
      });
    }

    return results.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const moderateDraftResult = mutation({
  args: {
    shortId: v.string(),
    action: v.union(
      v.literal("verify"),
      v.literal("void"),
      v.literal("override_team_1"),
      v.literal("override_team_2")
    ),
    moderatedByClerkUserId: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
    if (!draft) {
      throw new Error("Draft not found");
    }
    if (draft.status !== "complete") {
      throw new Error("Only completed drafts can be moderated");
    }
    if (
      draft.winnerTeam === undefined &&
      (args.action === "verify" || args.action === "void")
    ) {
      throw new Error("Draft has no winner to moderate");
    }

    const trimmedNote = args.note?.trim() ? args.note.trim() : undefined;
    const now = Date.now();

    if (args.action === "override_team_1" || args.action === "override_team_2") {
      const winnerTeam = args.action === "override_team_1" ? 1 : 2;
      const previousWinner = draft.winnerTeam;
      const overrideNote = trimmedNote
        ? `Winner override: Team ${previousWinner ?? "none"} -> Team ${winnerTeam}. ${trimmedNote}`
        : `Winner override: Team ${previousWinner ?? "none"} -> Team ${winnerTeam}.`;
      await ctx.db.patch(draft._id, {
        winnerTeam,
        resultStatus: "verified",
        resultModeratedBy: args.moderatedByClerkUserId,
        resultModeratedAt: now,
        resultModerationNote: overrideNote,
        winnerOverriddenBy: args.moderatedByClerkUserId,
        winnerOverriddenAt: now,
        winnerOverrideNote: overrideNote,
      });

      return { shortId: draft.shortId, resultStatus: "verified", winnerTeam };
    }

    const resultStatus = args.action === "verify" ? "verified" : "voided";

    await ctx.db.patch(draft._id, {
      resultStatus,
      resultModeratedBy: args.moderatedByClerkUserId,
      resultModeratedAt: now,
      resultModerationNote: trimmedNote,
    });

    return { shortId: draft.shortId, resultStatus, winnerTeam: draft.winnerTeam };
  },
});

export const cancelDraftAsAdmin = mutation({
  args: {
    shortId: v.string(),
    cancelledByClerkUserId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
    if (!draft) {
      throw new Error("Draft not found");
    }
    if (draft.status === "cancelled") {
      throw new Error("Draft is already cancelled");
    }
    if (
      draft.status === "complete" &&
      draft.gameStarted &&
      draft.resultStatus === "verified"
    ) {
      throw new Error("Cannot cancel a draft with a started game");
    }

    const trimmedReason = args.reason?.trim() ? args.reason.trim() : undefined;
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      status: "cancelled",
      cancelledBy: args.cancelledByClerkUserId,
      cancelledAt: now,
      cancelReason: trimmedReason,
      botPostedLink: true,
      botNotifiedCaptains: true,
    });

    return {
      shortId: draft.shortId,
      status: "cancelled" as const,
      cancelledAt: now,
      cancelledBy: args.cancelledByClerkUserId,
      cancelReason: trimmedReason,
    };
  },
});

export const getCancelableDrafts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const statuses = [
      "setup",
      "coin_flip",
      "realm_pick",
      "banning",
      "drafting",
      "complete",
    ] as const;
    const drafts = [];
    for (const status of statuses) {
      const byStatus = await ctx.db
        .query("drafts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      drafts.push(...byStatus);
    }

    const results = [];
    for (const draft of drafts) {
      if (
        draft.status === "complete" &&
        draft.gameStarted &&
        draft.resultStatus === "verified"
      ) {
        continue;
      }

      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const fights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      const captainCount = players.filter((player) => player.isCaptain).length;
      const assignedCount = players.filter((player) => player.team !== undefined).length;
      const selectedClassCount = players.filter(
        (player) => !!player.selectedClass?.trim()
      ).length;
      const fightCount = fights.length;
      const ageMinutes = Math.floor((now - draft._creationTime) / 60000);
      const minimumPlayers = draft.teamSize * 2;
      const hasEnoughPlayers = players.length >= minimumPlayers;
      const hasNoMeaningfulProgress =
        assignedCount === 0 && selectedClassCount === 0 && fightCount === 0;
      const isLikelyStale = ageMinutes >= 30 && hasNoMeaningfulProgress;

      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        status: draft.status,
        gameStarted: draft.gameStarted,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        createdBy: draft.createdBy,
        createdByDisplayName: draft.createdByDisplayName,
        createdByAvatarUrl: draft.createdByAvatarUrl,
        teamSize: draft.teamSize,
        playerCount: players.length,
        assignedCount,
        captainCount,
        selectedClassCount,
        fightCount,
        minimumPlayers,
        hasEnoughPlayers,
        ageMinutes,
        isLikelyStale,
        _creationTime: draft._creationTime,
      });
    }

    return results.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Dev-only mutation to seed a completed+verified draft directly.
 * Never call this in production.
 */
export const seedVerifiedDraft = mutation({
  args: {
    shortId: v.string(),
    discordGuildId: v.string(),
    discordGuildName: v.optional(v.string()),
    createdBy: v.string(),
    createdByDisplayName: v.optional(v.string()),
    createdByAvatarUrl: v.optional(v.string()),
    winnerTeam: v.union(v.literal(1), v.literal(2)),
    type: v.optional(v.union(v.literal("traditional"), v.literal("pvp"))),
    team1Realm: v.optional(v.string()),
    team2Realm: v.optional(v.string()),
    players: v.array(
      v.object({
        discordUserId: v.string(),
        displayName: v.string(),
        avatarUrl: v.optional(v.string()),
        team: v.union(v.literal(1), v.literal(2)),
        isCaptain: v.boolean(),
      })
    ),
    bans: v.optional(
      v.array(
        v.object({
          team: v.union(v.literal(1), v.literal(2)),
          className: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const draftType = args.type ?? "traditional";
    const draftData: any = {
      shortId: args.shortId,
      type: draftType,
      status: "complete" as const,
      teamSize: Math.max(
        args.players.filter((p) => p.team === 1).length,
        args.players.filter((p) => p.team === 2).length
      ),
      discordGuildId: args.discordGuildId,
      discordGuildName: args.discordGuildName,
      discordChannelId: "seed-channel",
      createdBy: args.createdBy,
      createdByDisplayName: args.createdByDisplayName,
      createdByAvatarUrl: args.createdByAvatarUrl,
      winnerTeam: args.winnerTeam,
      pendingWinnerTeam: args.winnerTeam,
      setFinalizedAt: Date.now(),
      setFinalizedBy: args.createdBy,
      resultStatus: "verified" as const,
      resultModeratedBy: "seed-admin",
      resultModeratedAt: Date.now(),
      gameStarted: true,
    };
    if (args.team1Realm) draftData.team1Realm = args.team1Realm;
    if (args.team2Realm) draftData.team2Realm = args.team2Realm;
    const draftId = await ctx.db.insert("drafts", draftData);

    for (const player of args.players) {
      await ctx.db.insert("draftPlayers", {
        draftId,
        discordUserId: player.discordUserId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        team: player.team,
        isCaptain: player.isCaptain,
        token: `seed-${args.shortId}-${player.discordUserId}`,
      });
    }

    if (args.bans) {
      for (const ban of args.bans) {
        await ctx.db.insert("draftBans", {
          draftId,
          team: ban.team,
          className: ban.className,
        });
      }
    }

    return { draftId, shortId: args.shortId };
  },
});

export const seedTrackingDemoDraft = mutation({
  args: {
    discordGuildId: v.string(),
    discordGuildName: v.optional(v.string()),
    createdBy: v.string(),
    players: v.array(
      v.object({
        discordUserId: v.string(),
        displayName: v.string(),
        avatarUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.players.length < 10) {
      throw new Error("Need at least 10 players for tracking demo draft");
    }

    let shortId = `demo-${generateShortId()}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await ctx.db
        .query("drafts")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
      if (!existing) break;
      shortId = `demo-${generateShortId()}`;
    }

    const teamSize = 5;
    const selectedPlayers = args.players.slice(0, teamSize * 2);
    const team1 = selectedPlayers.slice(0, teamSize);
    const team2 = selectedPlayers.slice(teamSize, teamSize * 2);

    const draftId = await ctx.db.insert("drafts", {
      shortId,
      type: "traditional",
      status: "complete",
      teamSize,
      discordGuildId: args.discordGuildId,
      discordGuildName: args.discordGuildName,
      discordChannelId: "demo-channel",
      createdBy: args.createdBy,
      team1CaptainId: team1[0]?.discordUserId,
      team2CaptainId: team2[0]?.discordUserId,
      team1Realm: "Albion",
      team2Realm: "Midgard",
      gameStarted: true,
      team1FightWins: 1,
      team2FightWins: 0,
      setScore: "1-0",
    });

    const playerTokens: { discordUserId: string; token: string }[] = [];
    const draftedRows: {
      _id: Id<"draftPlayers">;
      discordUserId: string;
      className: string;
      team: 1 | 2;
    }[] = [];

    for (let i = 0; i < team1.length; i += 1) {
      const player = team1[i];
      const className = classesByRealm.Albion[i % classesByRealm.Albion.length];
      const token = generateToken();
      const playerId = await ctx.db.insert("draftPlayers", {
        draftId,
        discordUserId: player.discordUserId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        team: 1,
        isCaptain: i === 0,
        token,
        selectedClass: className,
      });
      playerTokens.push({ discordUserId: player.discordUserId, token });
      draftedRows.push({
        _id: playerId,
        discordUserId: player.discordUserId,
        className,
        team: 1,
      });
    }

    for (let i = 0; i < team2.length; i += 1) {
      const player = team2[i];
      const className = classesByRealm.Midgard[i % classesByRealm.Midgard.length];
      const token = generateToken();
      const playerId = await ctx.db.insert("draftPlayers", {
        draftId,
        discordUserId: player.discordUserId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        team: 2,
        isCaptain: i === 0,
        token,
        selectedClass: className,
      });
      playerTokens.push({ discordUserId: player.discordUserId, token });
      draftedRows.push({
        _id: playerId,
        discordUserId: player.discordUserId,
        className,
        team: 2,
      });
    }

    await ctx.db.insert("draftBans", {
      draftId,
      team: 1,
      className: "Berserker",
    });
    await ctx.db.insert("draftBans", {
      draftId,
      team: 2,
      className: "Cleric",
    });

    await ctx.db.insert("draftFights", {
      draftId,
      fightNumber: 1,
      winnerTeam: 1,
      classesByPlayer: draftedRows.map((row) => ({
        playerId: row._id,
        discordUserId: row.discordUserId,
        className: row.className,
      })),
      submittedBy: args.createdBy,
    });

    return { draftId, shortId, playerTokens };
  },
});

/**
 * Dev-only mutation to delete all seed drafts (shortId starts with "seed-").
 */
export const cleanupSeedDrafts = mutation({
  args: {},
  handler: async (ctx) => {
    const allDrafts = await ctx.db.query("drafts").collect();
    let deleted = 0;
    for (const draft of allDrafts) {
      if (draft.shortId.startsWith("seed-")) {
        // Delete associated players
        const players = await ctx.db
          .query("draftPlayers")
          .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
          .collect();
        for (const player of players) {
          await ctx.db.delete(player._id);
        }
        // Delete associated bans
        const bans = await ctx.db
          .query("draftBans")
          .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
          .collect();
        for (const ban of bans) {
          await ctx.db.delete(ban._id);
        }
        const fights = await ctx.db
          .query("draftFights")
          .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
          .collect();
        for (const fight of fights) {
          await ctx.db.delete(fight._id);
        }
        await ctx.db.delete(draft._id);
        deleted += 1;
      }
    }
    return { deleted };
  },
});

export const devBackfillCompletedDraftTracking = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 200, 1000));
    const drafts = await ctx.db.query("drafts").collect();
    let patchedDrafts = 0;
    let insertedFights = 0;
    const touchedShortIds: string[] = [];

    const resolveRealmForTeam = (draft: any, team: 1 | 2): string | undefined =>
      team === 1 ? draft.team1Realm : draft.team2Realm;

    const parseSetScore = (
      score: string | undefined,
      winnerTeam: 1 | 2 | undefined
    ): { team1Wins: number; team2Wins: number } => {
      if (score && /^\d+-\d+$/.test(score)) {
        const [a, b] = score.split("-").map((value) => Number(value));
        if (
          Number.isFinite(a) &&
          Number.isFinite(b) &&
          a >= 0 &&
          b >= 0 &&
          a + b <= MAX_FIGHTS &&
          (a >= REQUIRED_WINS || b >= REQUIRED_WINS)
        ) {
          return { team1Wins: a, team2Wins: b };
        }
      }
      if (winnerTeam === 2) return { team1Wins: 1, team2Wins: REQUIRED_WINS };
      return { team1Wins: REQUIRED_WINS, team2Wins: 1 };
    };

    const buildWinnerSequence = (
      team1Wins: number,
      team2Wins: number
    ): (1 | 2)[] => {
      const winnerTeam: 1 | 2 = team1Wins > team2Wins ? 1 : 2;
      const loserTeam: 1 | 2 = winnerTeam === 1 ? 2 : 1;
      const winnerWins = Math.max(team1Wins, team2Wins);
      const loserWins = Math.min(team1Wins, team2Wins);
      const sequence: (1 | 2)[] = [];
      for (let i = 0; i < loserWins; i += 1) {
        sequence.push(i % 2 === 0 ? winnerTeam : loserTeam);
      }
      while (sequence.filter((team) => team === winnerTeam).length < winnerWins - 1) {
        sequence.push(winnerTeam);
      }
      while (sequence.filter((team) => team === loserTeam).length < loserWins) {
        sequence.push(loserTeam);
      }
      sequence.push(winnerTeam);
      return sequence.slice(0, winnerWins + loserWins);
    };

    for (const draft of drafts) {
      if (patchedDrafts >= limit) break;
      if (draft.status !== "complete") continue;

      const existingFights = await ctx.db
        .query("draftFights")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      if (existingFights.length > 0) continue;

      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      if (players.length === 0) continue;

      const winnerTeam =
        draft.winnerTeam === 1 || draft.winnerTeam === 2 ? draft.winnerTeam : 1;
      const parsed = parseSetScore(draft.setScore, winnerTeam);
      const team1Wins = parsed.team1Wins;
      const team2Wins = parsed.team2Wins;
      const winnerSequence = buildWinnerSequence(team1Wins, team2Wins);

      for (let fightIndex = 0; fightIndex < winnerSequence.length; fightIndex += 1) {
        const fightNumber = fightIndex + 1;
        const classesByPlayer = players.map((player, playerIndex) => {
          const realm = resolveRealmForTeam(draft, player.team ?? 1);
          const pool =
            (realm && classesByRealm[realm as keyof typeof classesByRealm]) || allClasses;
          const className =
            player.selectedClass || pool[(playerIndex + fightIndex) % pool.length];
          return {
            playerId: player._id,
            discordUserId: player.discordUserId,
            className,
          };
        });

        await ctx.db.insert("draftFights", {
          draftId: draft._id,
          fightNumber,
          winnerTeam: winnerSequence[fightIndex],
          classesByPlayer,
          submittedBy: draft.createdBy,
        });
        insertedFights += 1;
      }

      const lastFightIndex = winnerSequence.length - 1;
      for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
        const player = players[playerIndex];
        const realm = resolveRealmForTeam(draft, player.team ?? 1);
        const pool =
          (realm && classesByRealm[realm as keyof typeof classesByRealm]) || allClasses;
        const className =
          player.selectedClass || pool[(playerIndex + lastFightIndex) % pool.length];
        await ctx.db.patch(player._id, { selectedClass: className });
      }

      await ctx.db.patch(draft._id, {
        gameStarted: true,
        team1FightWins: team1Wins,
        team2FightWins: team2Wins,
        setScore: buildSetScore(team1Wins, team2Wins),
        winnerTeam: team1Wins > team2Wins ? 1 : 2,
        pendingWinnerTeam: team1Wins > team2Wins ? 1 : 2,
        setFinalizedAt: Date.now(),
        setFinalizedBy: draft.createdBy,
      });

      patchedDrafts += 1;
      touchedShortIds.push(draft.shortId);
    }

    return {
      patchedDrafts,
      insertedFights,
      touchedShortIds,
    };
  },
});

export const getActiveDrafts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const statuses = ["setup", "coin_flip", "realm_pick", "banning", "drafting"] as const;
    const active = [];
    for (const status of statuses) {
      const drafts = await ctx.db
        .query("drafts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      active.push(...drafts);
    }
    const completedNotStarted = (
      await ctx.db
        .query("drafts")
        .withIndex("by_status", (q) => q.eq("status", "complete"))
        .collect()
    ).filter((d) => !d.gameStarted);
    active.push(...completedNotStarted);

    const results = [];
    for (const draft of active) {
      const ageMs = now - draft._creationTime;
      if (ageMs >= STALE_DRAFT_MAX_AGE_MS) {
        continue;
      }

      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();

      const hasAssignedPlayers = players.some((player) => player.team !== undefined);
      const hasSelectedClasses = players.some(
        (player) => !!player.selectedClass?.trim()
      );
      const hasCaptains = players.some((player) => player.isCaptain);
      const hasProgress = hasAssignedPlayers || hasSelectedClasses || hasCaptains;

      if (ageMs >= STALE_DRAFT_NO_PROGRESS_MS && !hasProgress) {
        continue;
      }

      results.push({
        shortId: draft.shortId,
        status: draft.status,
        gameStarted: draft.gameStarted,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        discordTextChannelId: draft.discordTextChannelId,
        team1CaptainId: draft.team1CaptainId,
        team2CaptainId: draft.team2CaptainId,
        botPostedLink: draft.botPostedLink,
        botNotifiedCaptains: draft.botNotifiedCaptains,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
        })),
      });
    }

    return results;
  },
});

export const getActiveDraftTokens = internalQuery({
  args: { shortId: v.string() },
  handler: async (ctx, { shortId }) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    if (!draft) return null;
    const players = await ctx.db
      .query("draftPlayers")
      .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
      .collect();
    return players.map((p) => ({
      discordUserId: p.discordUserId,
      token: p.token,
    }));
  },
});

export const markBotPostedLink = mutation({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
    if (!draft) throw new Error("Draft not found");
    await ctx.db.patch(draft._id, { botPostedLink: true });
  },
});

export const markBotNotifiedCaptains = mutation({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
    if (!draft) throw new Error("Draft not found");
    await ctx.db.patch(draft._id, { botNotifiedCaptains: true });
  },
});

export const getGuildSettings = query({
  args: { discordGuildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("draftGuildSettings")
      .withIndex("by_guild", (q) => q.eq("discordGuildId", args.discordGuildId))
      .unique();
  },
});

export const upsertGuildSettings = mutation({
  args: {
    discordGuildId: v.string(),
    team1ChannelId: v.string(),
    team2ChannelId: v.string(),
    lobbyChannelId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("draftGuildSettings")
      .withIndex("by_guild", (q) => q.eq("discordGuildId", args.discordGuildId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        team1ChannelId: args.team1ChannelId,
        team2ChannelId: args.team2ChannelId,
        lobbyChannelId: args.lobbyChannelId,
      });
      return existing._id;
    }

    return await ctx.db.insert("draftGuildSettings", {
      discordGuildId: args.discordGuildId,
      team1ChannelId: args.team1ChannelId,
      team2ChannelId: args.team2ChannelId,
      lobbyChannelId: args.lobbyChannelId,
    });
  },
});
