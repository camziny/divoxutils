import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const appRoot = path.resolve(process.cwd(), "src", "app");

const readAppFile = (relativePath: string) =>
  readFileSync(path.join(appRoot, relativePath), "utf8");

test("CharacterSearchAndAdd uses sonner success toast for add flow", () => {
  const source = readAppFile("user-characters/_components/CharacterSearchAndAdd.tsx");
  assert.match(source, /import\s+\{\s*toast\s*\}\s+from\s+"sonner"/);
  assert.match(source, /toast\.success\(`Successfully added/);
});

test("CharacterListOptimized uses sonner success toast for delete flow", () => {
  const source = readAppFile("components/CharacterListOptimized.tsx");
  assert.match(source, /import\s+\{\s*toast\s*\}\s+from\s+"sonner"/);
  assert.match(source, /toast\.success\(`Successfully deleted/);
});
