import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function collectFiles(dir: string, matcher: (name: string) => boolean): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, matcher));
      continue;
    }
    if (entry.isFile() && matcher(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const appApiRouteFiles = collectFiles("src/app/api", (name) => name === "route.ts");
const serverApiRouteHandlerFiles = collectFiles(
  "src/server/api",
  (name) => /RouteHandlers\.ts$/.test(name)
);
const serverTopLevelRouteHandlerFiles = readdirSync("src/server", { withFileTypes: true })
  .filter((entry) => entry.isFile() && /RouteHandlers\.ts$/.test(entry.name))
  .map((entry) => `src/server/${entry.name}`);
const serviceBackedRoutes = new Set([
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
  "src/app/api/my-characters/[characterId]/route.ts",
  "src/app/api/batchedLeaderboardUpdate/route.ts",
  "src/app/api/batchedRealmUpdate/route.ts",
  "src/app/api/batchedHeraldUpdate/route.ts",
  "src/app/api/clerk-webhook/route.ts",
]);

test("all app route handlers delegate through server layer", () => {
  for (const routePath of appApiRouteFiles) {
    const source = readFileSync(routePath, "utf8");

    assert.equal(
      source.includes("@/server/"),
      true,
      `Expected ${routePath} to import through @/server`
    );
    assert.equal(
      source.includes("@/controllers/"),
      false,
      `Found deprecated controller import in ${routePath}`
    );
  }
});

test("service-backed app route handlers import server services", () => {
  for (const routePath of appApiRouteFiles) {
    if (!serviceBackedRoutes.has(routePath)) {
      continue;
    }
    const source = readFileSync(routePath, "utf8");

    assert.equal(
      source.includes("@/server/services/"),
      true,
      `Expected ${routePath} to use service-backed server handlers`
    );
  }
});

test("server api and route handler files do not import controllers", () => {
  const filesToCheck = [...serverApiRouteHandlerFiles, ...serverTopLevelRouteHandlerFiles];
  for (const filePath of filesToCheck) {
    const source = readFileSync(filePath, "utf8");
    assert.equal(
      source.includes("@/controllers/"),
      false,
      `Found deprecated controller import in ${filePath}`
    );
  }
});
