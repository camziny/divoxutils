import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";

test("migration guard: migrated app routes exist and pages routes removed", () => {
  const appRoutes = [
    "src/app/api/leaderboard/route.ts",
    "src/app/api/draft-stats/overall/route.ts",
    "src/app/api/draft-stats/captain/route.ts",
    "src/app/api/draft-stats/head-to-head/route.ts",
    "src/app/api/draft-stats/player-drilldown/route.ts",
    "src/app/api/draft-stats/drafts/route.ts",
    "src/app/api/characters/route.ts",
    "src/app/api/getCurrentUser/route.ts",
    "src/app/api/users/route.ts",
    "src/app/api/userCharacters/route.ts",
    "src/app/api/characters/[id]/route.ts",
    "src/app/api/charactersByUser/[id]/route.ts",
  ];
  const legacyPagesRoutes = [
    "pages/api/leaderboard/index.ts",
    "pages/api/draft-stats/overall.ts",
    "pages/api/draft-stats/captain.ts",
    "pages/api/draft-stats/head-to-head.ts",
    "pages/api/draft-stats/player-drilldown.ts",
    "pages/api/draft-stats/drafts.ts",
    "pages/api/characters/index.ts",
    "pages/api/characters/add.ts",
    "pages/api/getCurrentUser/index.ts",
    "pages/api/users/index.ts",
    "pages/api/userCharacters/index.ts",
    "pages/api/characters/[id].ts",
    "pages/api/charactersByUser/[id].ts",
    "pages/api/account/index.ts",
    "pages/api/account/create.ts",
    "pages/api/account/[id].ts",
    "pages/api/account/update/[id].ts",
    "pages/api/account/delete/[id].ts",
  ];

  for (const route of appRoutes) {
    assert.equal(existsSync(route), true);
  }
  for (const route of legacyPagesRoutes) {
    assert.equal(existsSync(route), false);
  }
});
