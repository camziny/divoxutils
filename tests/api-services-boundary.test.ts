import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const serviceBackedRoutes = [
  "src/app/api/users/route.ts",
  "src/app/api/users/[clerkUserId]/route.ts",
  "src/app/api/delete/user/[clerkUserId]/route.ts",
  "src/app/api/users/characters/[name]/route.ts",
  "src/app/api/users/stats/[name]/route.ts",
  "src/app/api/characters/route.ts",
  "src/app/api/characters/[id]/route.ts",
  "src/app/api/characters/search/route.ts",
  "src/app/api/charactersByUser/[id]/route.ts",
  "src/app/api/userCharacters/route.ts",
  "src/app/api/userCharacters/[clerkUserId]/[characterId]/route.ts",
  "src/app/api/userCharactersByUserId/[userId]/route.ts",
  "src/app/api/batchedLeaderboardUpdate/route.ts",
  "src/app/api/batchedRealmUpdate/route.ts",
  "src/app/api/batchedHeraldUpdate/route.ts",
  "src/app/api/clerk-webhook/route.ts",
];

const apiFoldersToCheck = [
  "src/app/api/users/route.ts",
  "src/app/api/users/[clerkUserId]/route.ts",
  "src/app/api/delete/user/[clerkUserId]/route.ts",
  "src/app/api/users/characters/[name]/route.ts",
  "src/app/api/users/stats/[name]/route.ts",
  "src/app/api/characters/route.ts",
  "src/app/api/characters/[id]/route.ts",
  "src/app/api/characters/search/route.ts",
  "src/app/api/charactersByUser/[id]/route.ts",
  "src/app/api/userCharacters/route.ts",
  "src/app/api/userCharacters/[clerkUserId]/[characterId]/route.ts",
  "src/app/api/userCharactersByUserId/[userId]/route.ts",
  "src/app/api/batchedLeaderboardUpdate/route.ts",
  "src/app/api/batchedRealmUpdate/route.ts",
  "src/app/api/batchedHeraldUpdate/route.ts",
  "src/app/api/clerk-webhook/route.ts",
  "src/server/api/batchedLeaderboardUpdateRouteHandlers.ts",
  "src/server/api/batchedRealmUpdateRouteHandlers.ts",
  "src/server/api/batchedHeraldUpdateRouteHandlers.ts",
  "src/server/api/charactersCollectionRouteHandlers.ts",
  "src/server/api/myCharactersAddRouteHandlers.ts",
];

test("service-backed routes import server services", () => {
  for (const routePath of serviceBackedRoutes) {
    const source = readFileSync(routePath, "utf8");
    assert.equal(
      source.includes("@/server/services/"),
      true,
      `Expected ${routePath} to import from @/server/services`
    );
  }
});

test("api route files and handlers do not import controllers", () => {
  for (const filePath of apiFoldersToCheck) {
    const source = readFileSync(filePath, "utf8");
    assert.equal(
      source.includes("@/controllers/"),
      false,
      `Found deprecated controller import in ${filePath}`
    );
  }
});
