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

  let currentTeam: 1 | 2 = secondPickTeam;
  while (sequence.length < totalPicks) {
    sequence.push(currentTeam);
    if (sequence.length < totalPicks) {
      sequence.push(currentTeam);
    }
    currentTeam = currentTeam === firstPickTeam ? secondPickTeam : firstPickTeam;
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
  args: { shortId: v.string(), token: v.string() },
  handler: async (ctx, { shortId, token }) => {
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    if (!draft) return null;
    const player = await ctx.db
      .query("draftPlayers")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!player || player.draftId !== draft._id) return null;
    return player;
  },
});

export const createDraft = mutation({
  args: {
    discordGuildId: v.string(),
    discordChannelId: v.string(),
    discordTextChannelId: v.optional(v.string()),
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
      teamSize: 8,
      discordGuildId: args.discordGuildId,
      discordChannelId: args.discordChannelId,
      discordTextChannelId: args.discordTextChannelId,
      createdBy: args.createdBy,
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
    if (draft.status !== "setup") throw new Error("Draft is not in setup phase");
    if (!draft.team1CaptainId || !draft.team2CaptainId) {
      throw new Error("Both captains must be assigned");
    }

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
    if (players.length < draft.teamSize * 2) {
      throw new Error(`Need at least ${draft.teamSize * 2} players`);
    }

    const coinFlipWinnerId =
      Math.random() < 0.5 ? draft.team1CaptainId : draft.team2CaptainId;

    await ctx.db.patch(args.draftId, {
      status: "coin_flip",
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
      if (!allClasses.includes(args.className)) {
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
    });
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
        discordTextChannelId: draft.discordTextChannelId,
        team1CaptainId: draft.team1CaptainId,
        team2CaptainId: draft.team2CaptainId,
        botPostedLink: draft.botPostedLink,
        botNotifiedCaptains: draft.botNotifiedCaptains,
        players: players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
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
