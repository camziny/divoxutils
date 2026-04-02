import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("my-characters client calls app api routes for add/delete", () => {
  const searchAdd = read("src/app/components/CharacterSearchAndAdd.tsx");
  const list = read("src/app/components/CharacterListOptimized.tsx");

  assert.match(searchAdd, /fetch\("\/api\/my-characters\/add"/);
  assert.match(list, /fetch\(\s*`\/api\/my-characters\/\$\{characterId\}`/);
});

test("app api handlers use auth and revalidate public character cache tag", () => {
  const addRoute = read("src/app/api/my-characters/add/route.ts");
  const deleteRoute = read("src/app/api/my-characters/[characterId]/route.ts");

  assert.match(addRoute, /auth\(\)/);
  assert.match(deleteRoute, /auth\(\)/);
  assert.match(addRoute, /revalidateTag\("public-user-characters"\)/);
  assert.match(deleteRoute, /revalidateTag\("public-user-characters"\)/);
});
