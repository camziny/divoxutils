import test from "node:test";
import assert from "node:assert/strict";
import * as draftFns from "../convex/drafts";

type TableName =
  | "drafts"
  | "draftPlayers"
  | "draftBans"
  | "draftFights"
  | "draftGuildSettings";

class MockDb {
  private tables: Record<TableName, any[]>;
  private idCounter = 0;

  constructor(seed?: Partial<Record<TableName, any[]>>) {
    this.tables = {
      drafts: seed?.drafts ? [...seed.drafts] : [],
      draftPlayers: seed?.draftPlayers ? [...seed.draftPlayers] : [],
      draftBans: seed?.draftBans ? [...seed.draftBans] : [],
      draftFights: seed?.draftFights ? [...seed.draftFights] : [],
      draftGuildSettings: seed?.draftGuildSettings ? [...seed.draftGuildSettings] : [],
    };
  }

  query(table: TableName) {
    const rows = this.tables[table];
    return {
      withIndex: (_index: string, builder: (q: { eq: (field: string, value: any) => any }) => any) => {
        const filter = builder({
          eq: (field: string, value: any) => ({ field, value }),
        });
        const filtered = rows.filter((row) => row[filter.field] === filter.value);
        return {
          unique: async () => {
            if (filtered.length > 1) throw new Error("Unique query returned multiple rows");
            return filtered[0] ?? null;
          },
          collect: async () => [...filtered],
        };
      },
      collect: async () => [...rows],
    };
  }

  async get(id: string) {
    for (const table of Object.keys(this.tables) as TableName[]) {
      const row = this.tables[table].find((r) => r._id === id);
      if (row) return row;
    }
    return null;
  }

  async insert(table: TableName, value: any) {
    const id = value._id ?? `${table}:${++this.idCounter}`;
    this.tables[table].push({ ...value, _id: id });
    return id;
  }

  async patch(id: string, updates: Record<string, any>) {
    for (const table of Object.keys(this.tables) as TableName[]) {
      const idx = this.tables[table].findIndex((r) => r._id === id);
      if (idx !== -1) {
        const current = this.tables[table][idx];
        this.tables[table][idx] = { ...current, ...updates };
        return;
      }
    }
    throw new Error(`Doc not found: ${id}`);
  }

  async delete(id: string) {
    for (const table of Object.keys(this.tables) as TableName[]) {
      const idx = this.tables[table].findIndex((r) => r._id === id);
      if (idx !== -1) {
        this.tables[table].splice(idx, 1);
        return;
      }
    }
  }
}

function makeCtx(seed?: Partial<Record<TableName, any[]>>) {
  return { db: new MockDb(seed) } as any;
}

test("getPlayerByToken is draft-scoped by shortId", async () => {
  const ctx = makeCtx({
    drafts: [
      { _id: "d1", shortId: "aaa" },
      { _id: "d2", shortId: "bbb" },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "tok-1", discordUserId: "u1" },
    ],
  });

  const inDraft = await (draftFns.getPlayerByToken as any)._handler(ctx, {
    shortId: "aaa",
    token: "tok-1",
  });
  const outOfDraft = await (draftFns.getPlayerByToken as any)._handler(ctx, {
    shortId: "bbb",
    token: "tok-1",
  });

  assert.equal(inDraft?._id, "p1");
  assert.equal(outOfDraft, null);
});

test("startDraft rejects creator token from a different draft", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 2,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        createdBy: "creator",
      },
      { _id: "d2", shortId: "bbb", status: "setup", teamSize: 2, createdBy: "creator" },
    ],
    draftPlayers: [
      { _id: "a1", draftId: "d1", token: "good", discordUserId: "creator" },
      { _id: "a2", draftId: "d1", token: "x1", discordUserId: "cap1" },
      { _id: "a3", draftId: "d1", token: "x2", discordUserId: "cap2" },
      { _id: "a4", draftId: "d1", token: "x3", discordUserId: "u4" },
      { _id: "b1", draftId: "d2", token: "cross", discordUserId: "creator" },
    ],
  });

  await assert.rejects(
    (draftFns.startDraft as any)._handler(ctx, { draftId: "d1", token: "cross" }),
    /Only the draft creator can start the draft/
  );
});

test("pickRealm rejects token from another draft even with matching user id", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "realm_pick",
        type: "traditional",
        firstRealmPickTeam: 1,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
      { _id: "d2", shortId: "bbb", status: "realm_pick", type: "traditional" },
    ],
    draftPlayers: [
      { _id: "p-good", draftId: "d1", token: "good", discordUserId: "cap1" },
      { _id: "p-cross", draftId: "d2", token: "cross", discordUserId: "cap1" },
    ],
  });

  await assert.rejects(
    (draftFns.pickRealm as any)._handler(ctx, {
      draftId: "d1",
      token: "cross",
      realm: "Albion",
    }),
    /Invalid token for this draft/
  );
});

test("undo from traditional banning with zero bans reverts only one realm pick", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "banning",
        type: "traditional",
        createdBy: "creator",
        coinFlipChoice: "realm_first",
        firstRealmPickTeam: 1,
        firstPickTeam: 2,
        team1Realm: "Albion",
        team2Realm: "Midgard",
        banSequence: [1, 2, 1, 2],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [{ _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" }],
    draftBans: [],
  });

  await (draftFns.undoLastAction as any)._handler(ctx, {
    draftId: "d1",
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "realm_pick");
  assert.equal(updated.team1Realm, "Albion");
  assert.equal(updated.team2Realm, undefined);
  assert.equal(updated.coinFlipChoice, "realm_first");
  assert.equal(updated.firstRealmPickTeam, 1);
  assert.equal(updated.firstPickTeam, 2);
});

test("startDraft with correct creator token transitions to coin_flip", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 2,
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "x1", discordUserId: "cap1" },
      { _id: "p3", draftId: "d1", token: "x2", discordUserId: "cap2" },
      { _id: "p4", draftId: "d1", token: "x3", discordUserId: "u4" },
    ],
  });

  await (draftFns.startDraft as any)._handler(ctx, {
    draftId: "d1",
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "coin_flip");
  assert.equal(updated.coinFlipWinnerId, undefined);
});

test("second startDraft in coin_flip performs the actual coin flip", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "coin_flip",
        teamSize: 2,
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "x1", discordUserId: "cap1" },
      { _id: "p3", draftId: "d1", token: "x2", discordUserId: "cap2" },
      { _id: "p4", draftId: "d1", token: "x3", discordUserId: "u4" },
    ],
  });

  await (draftFns.startDraft as any)._handler(ctx, {
    draftId: "d1",
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.ok(updated.coinFlipWinnerId === "cap1" || updated.coinFlipWinnerId === "cap2");
});

test("final ban enters drafting with one-time double pick for second team (first pick team 1)", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "banning",
        type: "pvp",
        teamSize: 4,
        firstPickTeam: 1,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        banSequence: [1],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p2", draftId: "d1", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
  });

  await (draftFns.banClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Cleric",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.deepEqual(updated.pickSequence, [1, 2, 2, 1, 2, 1]);
  assert.equal(updated.currentPickIndex, 0);
});

test("final ban enters drafting with alternating pick mode", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "banning",
        type: "pvp",
        teamSize: 4,
        firstPickTeam: 1,
        pickOrderMode: "alternating",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        banSequence: [1],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p2", draftId: "d1", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
  });

  await (draftFns.banClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Cleric",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.deepEqual(updated.pickSequence, [1, 2, 1, 2, 1, 2]);
  assert.equal(updated.currentPickIndex, 0);
});

test("final ban enters drafting with one-time double pick for second team (first pick team 2)", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "banning",
        type: "pvp",
        teamSize: 4,
        firstPickTeam: 2,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        banSequence: [1],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p2", draftId: "d1", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
  });

  await (draftFns.banClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Cleric",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.deepEqual(updated.pickSequence, [2, 1, 1, 2, 1, 2]);
  assert.equal(updated.currentPickIndex, 0);
});

test("updateSettings applies pvp with valid adjusted team size", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 8,
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "x1", discordUserId: "u1" },
      { _id: "p3", draftId: "d1", token: "x2", discordUserId: "u2" },
      { _id: "p4", draftId: "d1", token: "x3", discordUserId: "u3" },
      { _id: "p5", draftId: "d1", token: "x4", discordUserId: "u4" },
      { _id: "p6", draftId: "d1", token: "x5", discordUserId: "u5" },
      { _id: "p7", draftId: "d1", token: "x6", discordUserId: "u6" },
    ],
  });

  await (draftFns.updateSettings as any)._handler(ctx, {
    draftId: "d1",
    type: "pvp",
    teamSize: 3,
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.type, "pvp");
  assert.equal(updated.teamSize, 3);
  assert.equal(updated.pickOrderMode, "snake");
});

test("updateSettings persists selected pick order mode", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 4,
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "x1", discordUserId: "u1" },
      { _id: "p3", draftId: "d1", token: "x2", discordUserId: "u2" },
      { _id: "p4", draftId: "d1", token: "x3", discordUserId: "u3" },
      { _id: "p5", draftId: "d1", token: "x4", discordUserId: "u4" },
      { _id: "p6", draftId: "d1", token: "x5", discordUserId: "u5" },
      { _id: "p7", draftId: "d1", token: "x6", discordUserId: "u6" },
      { _id: "p8", draftId: "d1", token: "x7", discordUserId: "u7" },
    ],
  });

  await (draftFns.updateSettings as any)._handler(ctx, {
    draftId: "d1",
    type: "traditional",
    teamSize: 4,
    pickOrderMode: "alternating",
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.pickOrderMode, "alternating");
});

test("updateSettings rejects team size that exceeds available players", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 8,
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "x1", discordUserId: "u1" },
      { _id: "p3", draftId: "d1", token: "x2", discordUserId: "u2" },
      { _id: "p4", draftId: "d1", token: "x3", discordUserId: "u3" },
      { _id: "p5", draftId: "d1", token: "x4", discordUserId: "u4" },
      { _id: "p6", draftId: "d1", token: "x5", discordUserId: "u5" },
      { _id: "p7", draftId: "d1", token: "x6", discordUserId: "u6" },
    ],
  });

  await assert.rejects(
    (draftFns.updateSettings as any)._handler(ctx, {
      draftId: "d1",
      type: "pvp",
      teamSize: 4,
      token: "creator-token",
    }),
    /Need at least 8 players for 4v4/
  );
});

test("cancelDraftAsAdmin marks draft as cancelled with audit fields", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
  });

  const result = await (draftFns.cancelDraftAsAdmin as any)._handler(ctx, {
    shortId: "aaa",
    cancelledByClerkUserId: "admin_1",
    reason: "Restarting draft",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "cancelled");
  assert.equal(updated.cancelledBy, "admin_1");
  assert.equal(updated.cancelReason, "Restarting draft");
  assert.equal(typeof updated.cancelledAt, "number");
  assert.equal(result.shortId, "aaa");
  assert.equal(result.status, "cancelled");
});

test("cancelDraftAsAdmin rejects completed started drafts", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "complete",
        gameStarted: true,
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
  });

  await assert.rejects(
    (draftFns.cancelDraftAsAdmin as any)._handler(ctx, {
      shortId: "aaa",
      cancelledByClerkUserId: "admin_1",
      reason: "cleanup",
    }),
    /Cannot cancel a draft with a started game/
  );
});

test("getActiveDrafts excludes cancelled drafts", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "active-setup",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
      {
        _id: "d2",
        shortId: "active-complete",
        status: "complete",
        teamSize: 5,
        gameStarted: false,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
      {
        _id: "d3",
        shortId: "cancelled-one",
        status: "cancelled",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", discordUserId: "u1", displayName: "U1", token: "t1" },
      { _id: "p2", draftId: "d2", discordUserId: "u2", displayName: "U2", token: "t2" },
      { _id: "p3", draftId: "d3", discordUserId: "u3", displayName: "U3", token: "t3" },
    ],
  });

  const active = await (draftFns.getActiveDrafts as any)._handler(ctx, {});
  const shortIds = active.map((draft: { shortId: string }) => draft.shortId).sort();
  assert.deepEqual(shortIds, ["active-complete", "active-setup"]);
});

test("adminReplaceDraftFights persists known substitute metadata", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "subtest",
        status: "complete",
        teamSize: 1,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      {
        _id: "p1",
        draftId: "d1",
        discordUserId: "d1",
        displayName: "Alice",
        token: "t1",
        team: 1,
        isCaptain: true,
      },
      {
        _id: "p2",
        draftId: "d1",
        discordUserId: "d2",
        displayName: "Bob",
        token: "t2",
        team: 2,
        isCaptain: true,
      },
    ],
  });

  await (draftFns.adminReplaceDraftFights as any)._handler(ctx, {
    shortId: "subtest",
    submittedBy: "admin_1",
    fights: [
      {
        winnerTeam: 1,
        classesByPlayer: [
          { playerId: "p1", className: "Armsman" },
          { playerId: "p2", className: "Bard" },
        ],
      },
      {
        winnerTeam: 2,
        classesByPlayer: [
          { playerId: "p1", className: "Paladin" },
          { playerId: "p2", className: "Bard" },
        ],
      },
      {
        winnerTeam: 1,
        classesByPlayer: [
          {
            playerId: "p1",
            className: "Paladin",
            substituteMode: "known",
            substituteDiscordUserId: "d5",
            substituteDisplayName: "SubFive",
          },
          { playerId: "p2", className: "Bard" },
        ],
      },
      {
        winnerTeam: 2,
        classesByPlayer: [
          { playerId: "p1", className: "Armsman" },
          { playerId: "p2", className: "Bard" },
        ],
      },
      {
        winnerTeam: 1,
        classesByPlayer: [
          { playerId: "p1", className: "Paladin" },
          { playerId: "p2", className: "Bard" },
        ],
      },
    ],
  });

  const fights = await ctx.db.query("draftFights").collect();
  assert.equal(fights.length, 5);
  const fightThree = fights.find((fight: any) => fight.fightNumber === 3);
  assert.ok(fightThree);
  const p1Class = fightThree.classesByPlayer.find((entry: any) => entry.playerId === "p1");
  assert.ok(p1Class);
  assert.equal(p1Class.substituteMode, "known");
  assert.equal(p1Class.substituteDiscordUserId, "d5");
  assert.equal(p1Class.substituteDisplayName, "SubFive");
});

test("adminReplaceDraftFights rejects manual substitute with discord user id", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "subtest2",
        status: "complete",
        teamSize: 1,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      {
        _id: "p1",
        draftId: "d1",
        discordUserId: "d1",
        displayName: "Alice",
        token: "t1",
        team: 1,
        isCaptain: true,
      },
      {
        _id: "p2",
        draftId: "d1",
        discordUserId: "d2",
        displayName: "Bob",
        token: "t2",
        team: 2,
        isCaptain: true,
      },
    ],
  });

  await assert.rejects(
    (draftFns.adminReplaceDraftFights as any)._handler(ctx, {
      shortId: "subtest2",
      submittedBy: "admin_1",
      fights: [
        {
          winnerTeam: 1,
          classesByPlayer: [
            {
              playerId: "p1",
              className: "Armsman",
              substituteMode: "manual",
              substituteDiscordUserId: "d9",
              substituteDisplayName: "ManualSub",
            },
            { playerId: "p2", className: "Bard" },
          ],
        },
        {
          winnerTeam: 1,
          classesByPlayer: [
            { playerId: "p1", className: "Armsman" },
            { playerId: "p2", className: "Bard" },
          ],
        },
        {
          winnerTeam: 1,
          classesByPlayer: [
            { playerId: "p1", className: "Armsman" },
            { playerId: "p2", className: "Bard" },
          ],
        },
      ],
    }),
    /Manual substitute cannot include a discord user id/
  );
});
