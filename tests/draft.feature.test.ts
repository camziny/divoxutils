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
        const conditions: Array<{ field: string; value: any }> = [];
        const chain = {
          eq(field: string, value: any) {
            conditions.push({ field, value });
            return chain;
          },
        };
        builder(chain);
        const filtered = rows.filter((row) =>
          conditions.every((condition) => row[condition.field] === condition.value)
        );
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
  const scheduled: Array<{ delayMs: number; fn: unknown; args: unknown }> = [];
  return {
    db: new MockDb(seed),
    scheduler: {
      runAfter: async (delayMs: number, fn: unknown, args: unknown) => {
        scheduled.push({ delayMs, fn, args });
      },
    },
    _scheduled: scheduled,
  } as any;
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
        pickOrderMode: "snake",
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
        pickOrderMode: "snake",
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
  assert.equal(updated.pickOrderMode, "alternating");
});

test("updateSettings expands legacy untagged Mauler safe class when switching to pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "mauler-switch",
        status: "setup",
        teamSize: 8,
        type: "traditional",
        createdBy: "creator",
        safeClassNames: ["Mauler", "Hero"],
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
  assert.deepEqual(
    [...(updated.safeClassNames ?? [])].sort(),
    ["Hero", "Mauler (Alb)", "Mauler (Hib)", "Mauler (Mid)"].sort()
  );
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

test("updateSettings persists bansPerCaptain value", async () => {
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
    bansPerCaptain: 5,
    token: "creator-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.bansPerCaptain, 5);
});

test("updateSettings rejects bansPerCaptain outside 0..5", async () => {
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

  await assert.rejects(
    (draftFns.updateSettings as any)._handler(ctx, {
      draftId: "d1",
      type: "traditional",
      teamSize: 4,
      pickOrderMode: "alternating",
      bansPerCaptain: 6,
      token: "creator-token",
    }),
    /Bans per captain must be between 0 and 5/
  );
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

test("setCoinFlipChoice with zero bans enters drafting immediately in pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "pvpzero",
        status: "coin_flip",
        type: "pvp",
        teamSize: 4,
        coinFlipWinnerId: "cap1",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        createdBy: "creator",
        pickOrderMode: "alternating",
        bansPerCaptain: 0,
      },
    ],
    draftPlayers: [
      { _id: "cap1-player", draftId: "d1", token: "cap1-token", discordUserId: "cap1" },
      { _id: "cap2-player", draftId: "d1", token: "cap2-token", discordUserId: "cap2" },
    ],
  });

  await (draftFns.setCoinFlipChoice as any)._handler(ctx, {
    draftId: "d1",
    choice: "pick_first",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.equal(updated.currentBanIndex, undefined);
  assert.equal(updated.banSequence, undefined);
  assert.equal(updated.currentPickIndex, 0);
  assert.deepEqual(updated.pickSequence, [1, 2, 1, 2, 1, 2]);
});

test("setCoinFlipChoice builds 10-step ban sequence when bansPerCaptain is 5", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "pvpfive",
        status: "coin_flip",
        type: "pvp",
        teamSize: 4,
        coinFlipWinnerId: "cap1",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        createdBy: "creator",
        bansPerCaptain: 5,
      },
    ],
    draftPlayers: [
      { _id: "cap1-player", draftId: "d1", token: "cap1-token", discordUserId: "cap1" },
      { _id: "cap2-player", draftId: "d1", token: "cap2-token", discordUserId: "cap2" },
    ],
  });

  await (draftFns.setCoinFlipChoice as any)._handler(ctx, {
    draftId: "d1",
    choice: "pick_first",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "banning");
  assert.equal(updated.currentBanIndex, 0);
  assert.deepEqual(updated.banSequence, [2, 1, 2, 1, 2, 1, 2, 1, 2, 1]);
});

test("setCoinFlipChoice uses default bansPerCaptain when unset", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "pvpdefault",
        status: "coin_flip",
        type: "pvp",
        teamSize: 4,
        coinFlipWinnerId: "cap1",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      { _id: "cap1-player", draftId: "d1", token: "cap1-token", discordUserId: "cap1" },
      { _id: "cap2-player", draftId: "d1", token: "cap2-token", discordUserId: "cap2" },
    ],
  });

  await (draftFns.setCoinFlipChoice as any)._handler(ctx, {
    draftId: "d1",
    choice: "pick_first",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "banning");
  assert.deepEqual(updated.banSequence, [2, 1, 2, 1]);
  assert.equal(updated.currentBanIndex, 0);
});

test("setCoinFlipChoice respects bansPerCaptain = 1 in pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "pvpone",
        status: "coin_flip",
        type: "pvp",
        teamSize: 4,
        coinFlipWinnerId: "cap1",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        createdBy: "creator",
        bansPerCaptain: 1,
      },
    ],
    draftPlayers: [
      { _id: "cap1-player", draftId: "d1", token: "cap1-token", discordUserId: "cap1" },
      { _id: "cap2-player", draftId: "d1", token: "cap2-token", discordUserId: "cap2" },
    ],
  });

  await (draftFns.setCoinFlipChoice as any)._handler(ctx, {
    draftId: "d1",
    choice: "pick_first",
    token: "cap1-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "banning");
  assert.deepEqual(updated.banSequence, [2, 1]);
  assert.equal(updated.currentBanIndex, 0);
});

test("traditional realm pick skips banning when bansPerCaptain is 0", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "tradzero",
        status: "realm_pick",
        type: "traditional",
        teamSize: 4,
        firstRealmPickTeam: 1,
        firstPickTeam: 2,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        pickOrderMode: "alternating",
        banSequence: [],
      },
    ],
    draftPlayers: [
      { _id: "cap1-player", draftId: "d1", token: "cap1-token", discordUserId: "cap1" },
      { _id: "cap2-player", draftId: "d1", token: "cap2-token", discordUserId: "cap2" },
    ],
  });

  await (draftFns.pickRealm as any)._handler(ctx, {
    draftId: "d1",
    realm: "Albion",
    token: "cap1-token",
  });
  await (draftFns.pickRealm as any)._handler(ctx, {
    draftId: "d1",
    realm: "Midgard",
    token: "cap2-token",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.equal(updated.currentBanIndex, undefined);
  assert.equal(updated.currentPickIndex, 0);
  assert.deepEqual(updated.pickSequence, [2, 1, 2, 1, 2, 1]);
});

test("toggleAutoBanClass toggles creator setup auto-bans", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "autoban",
        status: "setup",
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [{ _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" }],
  });

  await (draftFns.toggleAutoBanClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Cleric",
    token: "creator-token",
  });
  let bans = await ctx.db.query("draftBans").collect();
  assert.equal(bans.length, 1);
  assert.equal(bans[0].className, "Cleric");
  assert.equal(bans[0].source, "auto");

  await (draftFns.toggleAutoBanClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Cleric",
    token: "creator-token",
  });
  bans = await ctx.db.query("draftBans").collect();
  assert.equal(bans.length, 0);
});

test("toggleAutoBanClass rejects non-creator and non-setup usage", async () => {
  const nonCreatorCtx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "autoban-auth",
        status: "setup",
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "creator-token", discordUserId: "creator" },
      { _id: "p2", draftId: "d1", token: "other-token", discordUserId: "other" },
    ],
  });
  await assert.rejects(
    (draftFns.toggleAutoBanClass as any)._handler(nonCreatorCtx, {
      draftId: "d1",
      className: "Cleric",
      token: "other-token",
    }),
    /Only the draft creator can edit auto-bans/
  );

  const nonSetupCtx = makeCtx({
    drafts: [
      {
        _id: "d2",
        shortId: "autoban-state",
        status: "banning",
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [{ _id: "p3", draftId: "d2", token: "creator-token", discordUserId: "creator" }],
  });
  await assert.rejects(
    (draftFns.toggleAutoBanClass as any)._handler(nonSetupCtx, {
      draftId: "d2",
      className: "Cleric",
      token: "creator-token",
    }),
    /Auto-bans can only be set in setup/
  );
});

test("toggleAutoBanClass rejects untagged Mauler in pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-mauler",
        shortId: "autoban-mauler",
        status: "setup",
        type: "pvp",
        createdBy: "creator",
      },
    ],
    draftPlayers: [{ _id: "p1", draftId: "d-mauler", token: "creator-token", discordUserId: "creator" }],
  });

  await assert.rejects(
    (draftFns.toggleAutoBanClass as any)._handler(ctx, {
      draftId: "d-mauler",
      className: "Mauler",
      token: "creator-token",
    }),
    /is not a valid class/
  );
});

test("toggleSafeClass toggles safe classes and removes existing bans", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-safe",
        shortId: "safe-setup",
        status: "setup",
        type: "traditional",
        createdBy: "creator",
      },
    ],
    draftPlayers: [{ _id: "p1", draftId: "d-safe", token: "creator-token", discordUserId: "creator" }],
    draftBans: [{ _id: "ban-safe", draftId: "d-safe", team: 1, className: "Cleric", source: "auto" }],
  });

  await (draftFns.toggleSafeClass as any)._handler(ctx, {
    draftId: "d-safe",
    className: "Cleric",
    token: "creator-token",
  });

  const updatedDraft = await ctx.db.get("d-safe");
  const bans = await ctx.db.query("draftBans").collect();
  assert.deepEqual(updatedDraft.safeClassNames, ["Cleric"]);
  assert.equal(bans.length, 0);

  await (draftFns.toggleSafeClass as any)._handler(ctx, {
    draftId: "d-safe",
    className: "Cleric",
    token: "creator-token",
  });
  const toggledDraft = await ctx.db.get("d-safe");
  assert.deepEqual(toggledDraft.safeClassNames, []);
});

test("banClass rejects safe classes", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-safe-ban",
        shortId: "safe-ban",
        status: "banning",
        type: "traditional",
        teamSize: 4,
        firstPickTeam: 1,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        team1Realm: "Albion",
        team2Realm: "Hibernia",
        banSequence: [1, 2],
        currentBanIndex: 0,
        safeClassNames: ["Hero"],
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d-safe-ban", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p2", draftId: "d-safe-ban", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
  });

  await assert.rejects(
    (draftFns.banClass as any)._handler(ctx, {
      draftId: "d-safe-ban",
      className: "Hero",
      token: "cap1-token",
    }),
    /Class is marked safe/
  );
});

test("setPlayerClass canonicalizes female alias class names", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-alias",
        shortId: "alias",
        status: "drafting",
        type: "traditional",
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      {
        _id: "p-cap1",
        draftId: "d-alias",
        token: "cap1-token",
        discordUserId: "cap1",
        displayName: "Cap 1",
        team: 1,
        isCaptain: true,
      },
    ],
  });

  await (draftFns.setPlayerClass as any)._handler(ctx, {
    draftId: "d-alias",
    playerId: "p-cap1",
    className: "Sorceress",
    token: "cap1-token",
  });

  const player = await ctx.db.get("p-cap1");
  assert.equal(player.selectedClass, "Sorcerer");
});

test("setPlayerClass accepts realm-tagged Mauler in pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-pvp-mauler",
        shortId: "pvp-mauler",
        status: "drafting",
        type: "pvp",
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      {
        _id: "p-cap1",
        draftId: "d-pvp-mauler",
        token: "cap1-token",
        discordUserId: "cap1",
        displayName: "Cap 1",
        team: 1,
        isCaptain: true,
      },
    ],
  });

  await (draftFns.setPlayerClass as any)._handler(ctx, {
    draftId: "d-pvp-mauler",
    playerId: "p-cap1",
    className: "Mauler (Alb)",
    token: "cap1-token",
  });

  const player = await ctx.db.get("p-cap1");
  assert.equal(player.selectedClass, "Mauler (Alb)");
});

test("banClass rejects classes already auto-banned and stores captain source", async () => {
  const rejectCtx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "ban-auto-reject",
        status: "banning",
        type: "pvp",
        teamSize: 3,
        firstPickTeam: 1,
        pickOrderMode: "alternating",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        banSequence: [1, 2],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [
      { _id: "p1", draftId: "d1", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p2", draftId: "d1", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
    draftBans: [{ _id: "ab1", draftId: "d1", team: 1, className: "Cleric", source: "auto" }],
  });

  await assert.rejects(
    (draftFns.banClass as any)._handler(rejectCtx, {
      draftId: "d1",
      className: "Cleric",
      token: "cap1-token",
    }),
    /Class is already banned/
  );

  const sourceCtx = makeCtx({
    drafts: [
      {
        _id: "d2",
        shortId: "ban-source",
        status: "banning",
        type: "pvp",
        teamSize: 3,
        firstPickTeam: 1,
        pickOrderMode: "alternating",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        banSequence: [1],
        currentBanIndex: 0,
      },
    ],
    draftPlayers: [
      { _id: "p3", draftId: "d2", token: "cap1-token", discordUserId: "cap1", isCaptain: true },
      { _id: "p4", draftId: "d2", token: "cap2-token", discordUserId: "cap2", isCaptain: true },
    ],
  });

  await (draftFns.banClass as any)._handler(sourceCtx, {
    draftId: "d2",
    className: "Cleric",
    token: "cap1-token",
  });
  const bans = await sourceCtx.db.query("draftBans").collect();
  assert.equal(bans.length, 1);
  assert.equal(bans[0].source, "captain");
});

test("traditional captain bans allow same class name across teams when not auto-banned", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "trad-same-class",
        status: "banning",
        type: "traditional",
        teamSize: 4,
        firstPickTeam: 1,
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
        team1Realm: "Albion",
        team2Realm: "Hibernia",
        banSequence: [1, 2],
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
    className: "Mauler",
    token: "cap1-token",
  });
  await (draftFns.banClass as any)._handler(ctx, {
    draftId: "d1",
    className: "Mauler",
    token: "cap2-token",
  });

  const bans = await ctx.db.query("draftBans").collect();
  assert.equal(bans.length, 2);
  assert.equal(bans[0].className, "Mauler");
  assert.equal(bans[1].className, "Mauler");
});

test("cancelDraftByCreator marks draft as cancelled after typed confirmation", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-cancel",
        shortId: "creator-cancel",
        status: "drafting",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-cancel",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
      },
    ],
  });

  const result = await (draftFns.cancelDraftByCreator as any)._handler(ctx, {
    draftId: "d-cancel",
    token: "creator-token",
    confirmationText: "  Cancel This Draft  ",
  });

  const updated = await ctx.db.get("d-cancel");
  assert.equal(updated.status, "cancelled");
  assert.equal(updated.cancelledBy, "creator");
  assert.equal(updated.cancelReason, "Cancelled by draft creator");
  assert.equal(updated.cancelledFromStatus, "drafting");
  assert.equal(updated.botPostedLink, false);
  assert.equal(updated.botNotifiedCaptains, false);
  assert.equal(typeof updated.cancelledAt, "number");
  assert.equal(result.shortId, "creator-cancel");
  assert.equal(result.status, "cancelled");
});

test("cancelDraftByCreator requires exact confirmation phrase", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-cancel-phrase",
        shortId: "creator-cancel-phrase",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-cancel-phrase",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
      },
    ],
  });

  await assert.rejects(
    (draftFns.cancelDraftByCreator as any)._handler(ctx, {
      draftId: "d-cancel-phrase",
      token: "creator-token",
      confirmationText: "cancel draft",
    }),
    /Type "cancel this draft" to confirm/
  );
});

test("cancelDraftByCreator rejects non-creator token", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-cancel-auth",
        shortId: "creator-cancel-auth",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-cancel-auth",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
      },
      {
        _id: "p-other",
        draftId: "d-cancel-auth",
        token: "other-token",
        discordUserId: "other",
        displayName: "Other",
      },
    ],
  });

  await assert.rejects(
    (draftFns.cancelDraftByCreator as any)._handler(ctx, {
      draftId: "d-cancel-auth",
      token: "other-token",
      confirmationText: "cancel this draft",
    }),
    /Only the draft creator can cancel the draft/
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
  assert.equal(updated.cancelledFromStatus, "setup");
  assert.equal(updated.botPostedLink, true);
  assert.equal(updated.botNotifiedCaptains, true);
  assert.equal(typeof updated.cancelledAt, "number");
  assert.equal(result.shortId, "aaa");
  assert.equal(result.status, "cancelled");
});

test("cancelDraftAsAdmin allows unverified completed started drafts", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "complete",
        gameStarted: true,
        resultStatus: "unverified",
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
    reason: "cleanup",
  });

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "cancelled");
  assert.equal(updated.cancelledBy, "admin_1");
  assert.equal(updated.cancelledFromStatus, "complete");
  assert.equal(result.status, "cancelled");
});

test("cancelDraftAsAdmin rejects verified completed started drafts", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "aaa",
        status: "complete",
        gameStarted: true,
        resultStatus: "verified",
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
            substituteAvatarUrl: "https://cdn.example.com/subfive.png",
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
  assert.equal(p1Class.substituteAvatarUrl, "https://cdn.example.com/subfive.png");
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

test("recordFightResult sets pending winner after third win", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-final",
        shortId: "final",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-final",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
        team: 1,
      },
      {
        _id: "p2",
        draftId: "d-final",
        token: "x2",
        discordUserId: "u2",
        displayName: "U2",
        team: 2,
      },
    ],
    draftFights: [
      {
        _id: "f1",
        draftId: "d-final",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "f2",
        draftId: "d-final",
        fightNumber: 2,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "f3",
        draftId: "d-final",
        fightNumber: 3,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "f4",
        draftId: "d-final",
        fightNumber: 4,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
    ],
  });

  await (draftFns.recordFightResult as any)._handler(ctx, {
    draftId: "d-final",
    winnerTeam: 1,
    classesByPlayer: [
      { playerId: "p-creator", className: "Armsman" },
      { playerId: "p2", className: "Bard" },
    ],
    token: "creator-token",
  });

  const updated = await ctx.db.get("d-final");
  assert.equal(updated.team1FightWins, 3);
  assert.equal(updated.team2FightWins, 2);
  assert.equal(updated.setScore, "3-2");
  assert.equal(updated.pendingWinnerTeam, 1);
  assert.equal(updated.winnerTeam, undefined);
  assert.equal(updated.setFinalizedAt, undefined);
});

test("updateFightWinner recomputes pending winner while unfinalized", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-edit",
        shortId: "edit",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-edit",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
        team: 1,
      },
    ],
    draftFights: [
      {
        _id: "e1",
        draftId: "d-edit",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "e2",
        draftId: "d-edit",
        fightNumber: 2,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "e3",
        draftId: "d-edit",
        fightNumber: 3,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "e4",
        draftId: "d-edit",
        fightNumber: 4,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
    ],
  });

  await (draftFns.updateFightWinner as any)._handler(ctx, {
    draftId: "d-edit",
    fightNumber: 4,
    winnerTeam: 2,
    token: "creator-token",
  });

  const updated = await ctx.db.get("d-edit");
  assert.equal(updated.team1FightWins, 2);
  assert.equal(updated.team2FightWins, 2);
  assert.equal(updated.setScore, "2-2");
  assert.equal(updated.pendingWinnerTeam, undefined);
  assert.equal(updated.winnerTeam, undefined);
});

test("finalizeSetResult finalizes pending winner and blocks further edits", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-lock",
        shortId: "lock",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
        pendingWinnerTeam: 2,
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-lock",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
        team: 1,
      },
    ],
    draftFights: [
      {
        _id: "l1",
        draftId: "d-lock",
        fightNumber: 1,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "l2",
        draftId: "d-lock",
        fightNumber: 2,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "l3",
        draftId: "d-lock",
        fightNumber: 3,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
      {
        _id: "l4",
        draftId: "d-lock",
        fightNumber: 4,
        winnerTeam: 2,
        classesByPlayer: [],
        submittedBy: "creator",
      },
    ],
  });

  await (draftFns.finalizeSetResult as any)._handler(ctx, {
    draftId: "d-lock",
    token: "creator-token",
  });

  const finalized = await ctx.db.get("d-lock");
  assert.equal(finalized.winnerTeam, 2);
  assert.equal(finalized.pendingWinnerTeam, 2);
  assert.equal(finalized.setScore, "1-3");
  assert.equal(finalized.setFinalizedBy, "creator");
  assert.equal(typeof finalized.setFinalizedAt, "number");
  assert.equal(ctx._scheduled.length, 1);
  assert.equal(ctx._scheduled[0].delayMs, 0);
  assert.deepEqual(ctx._scheduled[0].args, { draftId: "d-lock" });

  await assert.rejects(
    (draftFns.updateFightWinner as any)._handler(ctx, {
      draftId: "d-lock",
      fightNumber: 4,
      winnerTeam: 1,
      token: "creator-token",
    }),
    /Set is already finalized/
  );
});

test("setWinner does not queue review notification when already sent", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-sent",
        shortId: "sent",
        status: "complete",
        createdBy: "creator",
        reviewNotificationSentAt: Date.now(),
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-sent",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
      },
    ],
  });

  await (draftFns.setWinner as any)._handler(ctx, {
    draftId: "d-sent",
    winnerTeam: 1,
    token: "creator-token",
  });

  assert.equal(ctx._scheduled.length, 0);
});

test("setPlayerClass updates recorded fight class for captain team", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-fight-class",
        shortId: "fight-class",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      {
        _id: "p-cap1",
        draftId: "d-fight-class",
        token: "cap1-token",
        discordUserId: "cap1",
        displayName: "Cap 1",
        team: 1,
        isCaptain: true,
      },
      {
        _id: "p-cap2",
        draftId: "d-fight-class",
        token: "cap2-token",
        discordUserId: "cap2",
        displayName: "Cap 2",
        team: 2,
        isCaptain: true,
      },
    ],
    draftFights: [
      {
        _id: "fc-1",
        draftId: "d-fight-class",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [
          { playerId: "p-cap1", discordUserId: "cap1", className: "Armsman" },
          { playerId: "p-cap2", discordUserId: "cap2", className: "Bard" },
        ],
        submittedBy: "creator",
      },
    ],
  });

  await (draftFns.setPlayerClass as any)._handler(ctx, {
    draftId: "d-fight-class",
    fightNumber: 1,
    playerId: "p-cap1",
    className: "Paladin",
    token: "cap1-token",
  });

  const fights = await ctx.db.query("draftFights").collect();
  const updatedFight = fights.find((fight: any) => fight._id === "fc-1");
  const playerClass = updatedFight.classesByPlayer.find(
    (entry: any) => entry.playerId === "p-cap1"
  );
  assert.equal(playerClass.className, "Paladin");
});

test("setPlayerClass rejects recorded fight class edit on opposing team", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-fight-class-2",
        shortId: "fight-class-2",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      {
        _id: "p-cap1",
        draftId: "d-fight-class-2",
        token: "cap1-token",
        discordUserId: "cap1",
        displayName: "Cap 1",
        team: 1,
        isCaptain: true,
      },
      {
        _id: "p-cap2",
        draftId: "d-fight-class-2",
        token: "cap2-token",
        discordUserId: "cap2",
        displayName: "Cap 2",
        team: 2,
        isCaptain: true,
      },
    ],
    draftFights: [
      {
        _id: "fc-2",
        draftId: "d-fight-class-2",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [
          { playerId: "p-cap1", discordUserId: "cap1", className: "Armsman" },
          { playerId: "p-cap2", discordUserId: "cap2", className: "Bard" },
        ],
        submittedBy: "creator",
      },
    ],
  });

  await assert.rejects(
    (draftFns.setPlayerClass as any)._handler(ctx, {
      draftId: "d-fight-class-2",
      fightNumber: 1,
      playerId: "p-cap2",
      className: "Skald",
      token: "cap1-token",
    }),
    /Captains can only set classes for their own team/
  );
});

test("setPlayerClass rejects banned classes", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-banned-class",
        shortId: "banned-class",
        status: "drafting",
        createdBy: "creator",
        team1CaptainId: "cap1",
        team2CaptainId: "cap2",
      },
    ],
    draftPlayers: [
      {
        _id: "p-cap1",
        draftId: "d-banned-class",
        token: "cap1-token",
        discordUserId: "cap1",
        displayName: "Cap 1",
        team: 1,
        isCaptain: true,
      },
    ],
    draftBans: [{ _id: "ban-1", draftId: "d-banned-class", team: 1, className: "Paladin" }],
  });

  await assert.rejects(
    (draftFns.setPlayerClass as any)._handler(ctx, {
      draftId: "d-banned-class",
      playerId: "p-cap1",
      className: "Paladin",
      token: "cap1-token",
    }),
    /Class is banned/
  );
});

test("recordFightResult rejects banned classes", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-banned-fight",
        shortId: "banned-fight",
        status: "complete",
        gameStarted: true,
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-banned-fight",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
        team: 1,
      },
      {
        _id: "p2",
        draftId: "d-banned-fight",
        token: "x2",
        discordUserId: "u2",
        displayName: "U2",
        team: 2,
      },
    ],
    draftBans: [{ _id: "ban-1", draftId: "d-banned-fight", team: 1, className: "Bard" }],
  });

  await assert.rejects(
    (draftFns.recordFightResult as any)._handler(ctx, {
      draftId: "d-banned-fight",
      winnerTeam: 1,
      classesByPlayer: [
        { playerId: "p-creator", className: "Armsman" },
        { playerId: "p2", className: "Bard" },
      ],
      token: "creator-token",
    }),
    /Class is banned: Bard/
  );
});

test("recordFightResult accepts realm-tagged Mauler in pvp", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-pvp-mauler-fight",
        shortId: "pvp-mauler-fight",
        status: "complete",
        type: "pvp",
        gameStarted: true,
        createdBy: "creator",
      },
    ],
    draftPlayers: [
      {
        _id: "p-creator",
        draftId: "d-pvp-mauler-fight",
        token: "creator-token",
        discordUserId: "creator",
        displayName: "Creator",
        team: 1,
      },
      {
        _id: "p2",
        draftId: "d-pvp-mauler-fight",
        token: "x2",
        discordUserId: "u2",
        displayName: "U2",
        team: 2,
      },
    ],
  });

  await (draftFns.recordFightResult as any)._handler(ctx, {
    draftId: "d-pvp-mauler-fight",
    winnerTeam: 1,
    classesByPlayer: [
      { playerId: "p-creator", className: "Mauler (Alb)" },
      { playerId: "p2", className: "Cleric" },
    ],
    token: "creator-token",
  });

  const fights = await ctx.db.query("draftFights").collect();
  assert.equal(fights.length, 1);
  const maulerEntry = fights[0].classesByPlayer.find(
    (entry: { playerId: string }) => entry.playerId === "p-creator"
  );
  assert.equal(maulerEntry?.className, "Mauler (Alb)");
});

test("getCancelableDrafts marks older duplicate as safe when newer same-creator draft exists", async () => {
  const now = Date.now();
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-old",
        shortId: "old1",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        createdByDisplayName: "Creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - 45 * 60 * 1000,
      },
      {
        _id: "d-new",
        shortId: "new1",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        createdByDisplayName: "Creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - 5 * 60 * 1000,
      },
    ],
    draftPlayers: [],
  });

  const drafts = await (draftFns.getCancelableDrafts as any)._handler(ctx, {});
  const oldDraft = drafts.find((d: any) => d.shortId === "old1");
  assert.ok(oldDraft);
  assert.equal(oldDraft.cancelConfidence, "safe");
  assert.ok(
    oldDraft.cancelReasons.some((reason: string) =>
      reason.includes("newer draft by the same creator")
    )
  );
});

test("restoreCancelledDraftAsAdmin restores to pre-cancel status", async () => {
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "to-restore",
        status: "cancelled",
        cancelledBy: "admin_1",
        cancelledAt: Date.now(),
        cancelledFromStatus: "drafting",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
      },
    ],
  });

  const result = await (draftFns.restoreCancelledDraftAsAdmin as any)._handler(
    ctx,
    {
      shortId: "to-restore",
      restoredByClerkUserId: "admin_2",
    }
  );

  const updated = await ctx.db.get("d1");
  assert.equal(updated.status, "drafting");
  assert.equal(updated.cancelledBy, undefined);
  assert.equal(updated.cancelledAt, undefined);
  assert.equal(updated.cancelReason, undefined);
  assert.equal(updated.cancelledFromStatus, undefined);
  assert.equal(result.status, "drafting");
});

test("getCancelableDrafts does not classify age-only draft with activity as safe", async () => {
  const now = Date.now();
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d1",
        shortId: "active-old",
        status: "setup",
        teamSize: 5,
        createdBy: "creator",
        createdByDisplayName: "Creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - 2 * 24 * 60 * 60 * 1000,
      },
    ],
    draftPlayers: [
      {
        _id: "p1",
        draftId: "d1",
        discordUserId: "u1",
        displayName: "U1",
        token: "t1",
        team: 1,
        isCaptain: true,
        selectedClass: "Bard",
      },
      {
        _id: "p2",
        draftId: "d1",
        discordUserId: "u2",
        displayName: "U2",
        token: "t2",
        team: 2,
        isCaptain: false,
      },
    ],
    draftFights: [
      {
        _id: "f1",
        draftId: "d1",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
    ],
  });

  const drafts = await (draftFns.getCancelableDrafts as any)._handler(ctx, {});
  const draft = drafts.find((d: any) => d.shortId === "active-old");
  assert.ok(draft);
  assert.notEqual(draft.cancelConfidence, "safe");
});

test("getCancelledDraftsForAdmin returns only entries within retention window", async () => {
  const now = Date.now();
  const ninetyOneDaysMs = 91 * 24 * 60 * 60 * 1000;
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-keep",
        shortId: "keep",
        status: "cancelled",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - 2 * 24 * 60 * 60 * 1000,
        cancelledAt: now - 2 * 24 * 60 * 60 * 1000,
      },
      {
        _id: "d-drop",
        shortId: "drop",
        status: "cancelled",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - ninetyOneDaysMs,
        cancelledAt: now - ninetyOneDaysMs,
      },
    ],
  });

  const archived = await (draftFns.getCancelledDraftsForAdmin as any)._handler(
    ctx,
    {}
  );
  const shortIds = archived.map((d: any) => d.shortId);
  assert.deepEqual(shortIds, ["keep"]);
});

test("purgeExpiredCancelledDrafts deletes cancelled draft and related rows beyond 90 days", async () => {
  const now = Date.now();
  const oldTs = now - 91 * 24 * 60 * 60 * 1000;
  const ctx = makeCtx({
    drafts: [
      {
        _id: "d-old",
        shortId: "old",
        status: "cancelled",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: oldTs,
        cancelledAt: oldTs,
      },
      {
        _id: "d-new",
        shortId: "new",
        status: "cancelled",
        teamSize: 5,
        createdBy: "creator",
        discordGuildId: "g1",
        discordChannelId: "c1",
        _creationTime: now - 24 * 60 * 60 * 1000,
        cancelledAt: now - 24 * 60 * 60 * 1000,
      },
    ],
    draftPlayers: [
      { _id: "p-old", draftId: "d-old", token: "t1", discordUserId: "u1" },
      { _id: "p-new", draftId: "d-new", token: "t2", discordUserId: "u2" },
    ],
    draftBans: [
      { _id: "b-old", draftId: "d-old", className: "Cleric", bannedByTeam: 1 },
    ],
    draftFights: [
      {
        _id: "f-old",
        draftId: "d-old",
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [],
        submittedBy: "creator",
      },
    ],
  });

  const result = await (draftFns.purgeExpiredCancelledDrafts as any)._handler(
    ctx,
    { retentionDays: 90 }
  );
  assert.equal(result.deletedDrafts, 1);

  const remainingDrafts = await ctx.db.query("drafts").collect();
  const remainingPlayers = await ctx.db.query("draftPlayers").collect();
  const remainingBans = await ctx.db.query("draftBans").collect();
  const remainingFights = await ctx.db.query("draftFights").collect();

  assert.deepEqual(
    remainingDrafts.map((d: any) => d.shortId),
    ["new"]
  );
  assert.deepEqual(
    remainingPlayers.map((p: any) => p._id),
    ["p-new"]
  );
  assert.equal(remainingBans.length, 0);
  assert.equal(remainingFights.length, 0);
});
