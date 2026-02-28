import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { classesByRealm, allClasses, REALMS } from "./constants";

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
  firstPickTeam: 1 | 2
): (1 | 2)[] {
  const totalPicks = (teamSize - 1) * 2;
  const secondPickTeam: 1 | 2 = firstPickTeam === 1 ? 2 : 1;
  const sequence: (1 | 2)[] = [];

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

    const sanitizedPlayers = players.map(({ token, ...rest }) => rest);

    return { ...draft, players: sanitizedPlayers, bans };
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
        draft.firstPickTeam!
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
      resultStatus: "unverified",
      resultModeratedBy: undefined,
      resultModeratedAt: undefined,
      resultModerationNote: undefined,
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
        _creationTime: draft._creationTime,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
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
        _creationTime: draft._creationTime,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
        })),
      });
    }

    return results
      .sort(
        (a, b) =>
          (b.resultModeratedAt ?? b._creationTime) -
          (a.resultModeratedAt ?? a._creationTime)
      )
      .slice(0, 50);
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
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        type: draft.type,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        winnerTeam: draft.winnerTeam,
        resultStatus: draft.resultStatus,
        _creationTime: draft._creationTime,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
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
      results.push({
        _id: draft._id,
        shortId: draft.shortId,
        type: draft.type,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        winnerTeam: draft.winnerTeam,
        resultStatus: draft.resultStatus ?? "unverified",
        _creationTime: draft._creationTime,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
          isCaptain: p.isCaptain,
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
    action: v.union(v.literal("verify"), v.literal("void")),
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
    if (draft.winnerTeam === undefined) {
      throw new Error("Draft has no winner to moderate");
    }

    const resultStatus = args.action === "verify" ? "verified" : "voided";

    await ctx.db.patch(draft._id, {
      resultStatus,
      resultModeratedBy: args.moderatedByClerkUserId,
      resultModeratedAt: Date.now(),
      resultModerationNote: args.note?.trim() ? args.note.trim() : undefined,
    });

    return { shortId: draft.shortId, resultStatus };
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
        await ctx.db.delete(draft._id);
        deleted += 1;
      }
    }
    return { deleted };
  },
});

export const getActiveDrafts = query({
  args: {},
  handler: async (ctx) => {
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
      const players = await ctx.db
        .query("draftPlayers")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();

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
