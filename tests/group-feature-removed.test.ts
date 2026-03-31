import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const removedGroupRoutePaths = [
  "src/app/group-builder/page.tsx",
  "src/app/user/[name]/group/page.tsx",
  "pages/api/group/index.ts",
  "pages/api/group/[clerkUserId].ts",
  "pages/api/group/createGroup.ts",
  "pages/api/group/deleteGroup.ts",
  "pages/api/group/addUser.ts",
  "pages/api/group/removeUser.ts",
  "pages/api/group/saveGroup.ts",
  "pages/api/group/moveToActiveGroup.ts",
  "pages/api/group/group-owner.ts",
  "pages/api/group/group-by-name/[name].ts",
  "pages/api/group/group-by-id/[groupId]/users.ts",
  "pages/api/group/group-by-id/[groupId]/group-with-characters.ts",
];

test("group feature routes remain removed", () => {
  const reintroducedPaths = removedGroupRoutePaths.filter((relativePath) =>
    existsSync(join(root, relativePath))
  );

  assert.deepEqual(reintroducedPaths, []);
});
