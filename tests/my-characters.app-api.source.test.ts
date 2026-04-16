import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("my-characters client calls app api routes for add/delete", () => {
  const searchAdd = read("src/app/user-characters/_components/CharacterSearchAndAdd.tsx");
  const list = read("src/app/components/CharacterListOptimized.tsx");

  assert.match(searchAdd, /fetch\("\/api\/my-characters\/add"/);
  assert.match(list, /fetch\(\s*`\/api\/my-characters\/\$\{characterId\}`/);
});

test("my-characters search resets searching state on short input and clear", () => {
  const searchAdd = read("src/app/user-characters/_components/CharacterSearchAndAdd.tsx");
  assert.match(
    searchAdd,
    /if \(debouncedSearchTerm\.length < 3\) \{\s*setIsSearching\(false\);/s
  );
  assert.match(
    searchAdd,
    /const handleClear = useCallback\(\(\) => \{\s*setIsSearching\(false\);/s
  );
});

test("my-characters search empty-state is suppressed when an error message exists", () => {
  const searchAdd = read("src/app/user-characters/_components/CharacterSearchAndAdd.tsx");
  assert.match(
    searchAdd,
    /isExpanded && !isSearching && hasSearched && !hasResults && !message && name\.length >= 3/
  );
});

test("app api handlers use auth and revalidate public character cache tag", () => {
  const addRoute = read("src/app/api/my-characters/add/route.ts");
  const deleteRoute = read("src/app/api/my-characters/[characterId]/route.ts");

  assert.match(addRoute, /auth\(\)/);
  assert.match(deleteRoute, /auth\(\)/);
  assert.match(addRoute, /revalidateTag\("public-user-characters"\)/);
  assert.match(deleteRoute, /revalidateTag\("public-user-characters"\)/);
});
