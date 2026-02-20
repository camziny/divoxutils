import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { ConvexHttpClient } from "convex/browser";
import { PrismaClient } from "@prisma/client";

/* ─── Config ────────────────────────────────────────── */

const GUILD_ID = "test-guild";
const DRAFT_COUNT = 60;
const TEAM_SIZE = 5;
const BANS_PER_TEAM = 2;

const CLASSES_BY_REALM: Record<string, string[]> = {
  Albion: [
    "Armsman", "Cabalist", "Cleric", "Friar", "Heretic", "Infiltrator",
    "Mauler", "Mercenary", "Minstrel", "Necromancer", "Paladin", "Reaver",
    "Scout", "Sorcerer", "Theurgist", "Wizard",
  ],
  Hibernia: [
    "Animist", "Bainshee", "Bard", "Blademaster", "Champion", "Druid",
    "Eldritch", "Enchanter", "Hero", "Mauler", "Mentalist", "Nightshade",
    "Ranger", "Valewalker", "Vampiir", "Warden",
  ],
  Midgard: [
    "Berserker", "Bonedancer", "Healer", "Hunter", "Mauler", "Runemaster",
    "Savage", "Shadowblade", "Shaman", "Skald", "Spiritmaster", "Thane",
    "Valkyrie", "Warlock", "Warrior",
  ],
};

const ALL_CLASSES = Array.from(
  new Set(Object.values(CLASSES_BY_REALM).flat())
).sort();

const REALM_PAIRS: [string, string][] = [
  ["Albion", "Midgard"],
  ["Albion", "Hibernia"],
  ["Midgard", "Hibernia"],
  ["Midgard", "Albion"],
  ["Hibernia", "Albion"],
  ["Hibernia", "Midgard"],
];

/**
 * Matches the DUMMY_NAMES and discordUserIds from src/app/draft/test/page.tsx
 */
const PLAYERS = [
  { discordUserId: "player_0", displayName: "divox" },
  { discordUserId: "player_1", displayName: "xuu" },
  { discordUserId: "player_2", displayName: "dwal" },
  { discordUserId: "player_3", displayName: "tom" },
  { discordUserId: "player_4", displayName: "patar" },
  { discordUserId: "player_5", displayName: "barbarianz" },
  { discordUserId: "player_6", displayName: "farmacist" },
  { discordUserId: "player_7", displayName: "saki" },
  { discordUserId: "player_8", displayName: "venise" },
  { discordUserId: "player_9", displayName: "torm" },
  { discordUserId: "player_10", displayName: "ox" },
  { discordUserId: "player_11", displayName: "fou" },
  { discordUserId: "player_12", displayName: "lew" },
  { discordUserId: "player_13", displayName: "reza" },
  { discordUserId: "player_14", displayName: "hax" },
  { discordUserId: "player_15", displayName: "triq" },
  { discordUserId: "player_16", displayName: "vuu" },
  { discordUserId: "player_17", displayName: "kwel" },
];

/* ─── Helpers ───────────────────────────────────────── */

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  return new ConvexHttpClient(url);
}

function getPrisma() {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_PRISMA_URL;
  if (!url) throw new Error("Missing POSTGRES_URL_NON_POOLING");
  return new PrismaClient({ datasources: { db: { url } } });
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateShortId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

/* ─── Main ──────────────────────────────────────────── */

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run dev seed in production");
  }

  const convex = getConvexClient();
  const prisma = getPrisma();

  // ── Step 1: Clean up old seed data ──────────────────
  console.log("Cleaning up old Convex seed drafts...");
  try {
    const result = await convex.mutation(
      "drafts:cleanupSeedDrafts" as any,
      {}
    );
    console.log(`Deleted ${(result as any)?.deleted ?? 0} old seed drafts from Convex.`);
  } catch (err: any) {
    console.warn("Could not clean up old seed drafts:", err?.message);
  }

  console.log("Cleaning up old Postgres seed data...");
  // Remove old "seed_dXX" identity links from prior seed runs
  await prisma.userIdentityLink.deleteMany({
    where: {
      provider: "discord",
      providerUserId: { startsWith: "seed_" },
    },
  });
  await prisma.user.deleteMany({
    where: { clerkUserId: { startsWith: "dev_draft_seed_" } },
  });

  // ── Step 2: Create Postgres users + identity links ──
  console.log("Seeding Postgres users + identity links...");

  for (const player of PLAYERS) {
    const clerkUserId = `dev_draft_${player.discordUserId}`;

    // Check if a real user already owns this name
    const nameOwner = await prisma.user.findUnique({
      where: { name: player.displayName },
      select: { clerkUserId: true },
    });

    const nameIsAvailable =
      !nameOwner || nameOwner.clerkUserId === clerkUserId;

    // If name is taken by a real user, link the identity to THAT user instead
    const targetClerkUserId =
      nameOwner && !nameIsAvailable ? nameOwner.clerkUserId : clerkUserId;

    if (!nameOwner || nameIsAvailable) {
      // Create or update the seed user
      await prisma.user.upsert({
        where: { clerkUserId },
        update: { name: player.displayName },
        create: {
          clerkUserId,
          email: `${player.discordUserId}@draft.local`,
          name: player.displayName,
        },
      });
    } else {
      console.log(
        `  → "${player.displayName}" already exists as ${nameOwner.clerkUserId}, linking identity to that user`
      );
    }

    // Upsert identity link pointing at the target user
    const existingLink = await prisma.userIdentityLink.findUnique({
      where: {
        provider_providerUserId: {
          provider: "discord",
          providerUserId: player.discordUserId,
        },
      },
    });

    if (existingLink) {
      await prisma.userIdentityLink.update({
        where: { id: existingLink.id },
        data: { clerkUserId: targetClerkUserId, status: "linked" },
      });
    } else {
      // Check if the target user already has a discord link
      const targetHasDiscord = await prisma.userIdentityLink.findUnique({
        where: {
          clerkUserId_provider: {
            clerkUserId: targetClerkUserId,
            provider: "discord",
          },
        },
      });

      if (!targetHasDiscord) {
        await prisma.userIdentityLink.create({
          data: {
            clerkUserId: targetClerkUserId,
            provider: "discord",
            providerUserId: player.discordUserId,
            status: "linked",
          },
        });
      } else {
        console.log(
          `  → ${targetClerkUserId} already has a discord identity link, skipping`
        );
      }
    }
  }

  console.log(`Created/updated ${PLAYERS.length} users and identity links.`);

  // ── Step 3: Seed verified drafts in Convex ──────────
  console.log(`\nSeeding ${DRAFT_COUNT} verified drafts in Convex...`);

  let created = 0;
  let pvpCount = 0;
  let traditionalCount = 0;
  let realmPairIdx = 0;
  const realmTally: Record<string, number> = {};

  for (let i = 0; i < DRAFT_COUNT; i++) {
    const shortId = `seed-${generateShortId()}`;
    const shuffled = shuffle(PLAYERS).slice(0, TEAM_SIZE * 2);

    const team1 = shuffled.slice(0, TEAM_SIZE);
    const team2 = shuffled.slice(TEAM_SIZE, TEAM_SIZE * 2);

    const winnerTeam: 1 | 2 = Math.random() < 0.55 ? 1 : 2;
    const isPvp = i % 4 === 0;

    const players = [
      ...team1.map((p, idx) => ({
        discordUserId: p.discordUserId,
        displayName: p.displayName,
        team: 1 as const,
        isCaptain: idx === 0,
      })),
      ...team2.map((p, idx) => ({
        discordUserId: p.discordUserId,
        displayName: p.displayName,
        team: 2 as const,
        isCaptain: idx === 0,
      })),
    ];

    const seedArgs: Record<string, unknown> = {
      shortId,
      discordGuildId: GUILD_ID,
      createdBy: players[0].discordUserId,
      winnerTeam,
      players,
      type: isPvp ? "pvp" : "traditional",
    };

    const bans: Array<{ team: 1 | 2; className: string }> = [];

    if (!isPvp) {
      const [r1, r2] = REALM_PAIRS[realmPairIdx % REALM_PAIRS.length];
      seedArgs.team1Realm = r1;
      seedArgs.team2Realm = r2;
      realmPairIdx += 1;
      realmTally[r1] = (realmTally[r1] ?? 0) + 1;
      realmTally[r2] = (realmTally[r2] ?? 0) + 1;

      const t1BanPool = shuffle(CLASSES_BY_REALM[r2] ?? []);
      const t2BanPool = shuffle(CLASSES_BY_REALM[r1] ?? []);
      for (let b = 0; b < BANS_PER_TEAM; b++) {
        if (t1BanPool[b]) bans.push({ team: 1, className: t1BanPool[b] });
        if (t2BanPool[b]) bans.push({ team: 2, className: t2BanPool[b] });
      }
    } else {
      const pvpBanPool = shuffle([...ALL_CLASSES]);
      for (let b = 0; b < BANS_PER_TEAM; b++) {
        if (pvpBanPool[b * 2]) bans.push({ team: 1, className: pvpBanPool[b * 2] });
        if (pvpBanPool[b * 2 + 1]) bans.push({ team: 2, className: pvpBanPool[b * 2 + 1] });
      }
    }

    seedArgs.bans = bans;

    try {
      await convex.mutation("drafts:seedVerifiedDraft" as any, seedArgs);
      created += 1;
      if (isPvp) pvpCount += 1;
      else traditionalCount += 1;
    } catch (err: any) {
      console.error(`Failed to seed draft ${shortId}:`, err?.message);
    }
  }

  console.log(
    `Created ${created} verified drafts (${traditionalCount} traditional, ${pvpCount} pvp).`
  );
  console.log("Realm appearances:", realmTally);

  await prisma.$disconnect();
  console.log("\nDone! Refresh your app to see the data.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
