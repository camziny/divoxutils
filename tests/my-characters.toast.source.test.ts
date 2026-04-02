import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const componentsRoot = path.resolve(process.cwd(), "src", "app", "components");

const readComponent = (fileName: string) =>
  readFileSync(path.join(componentsRoot, fileName), "utf8");

test("CharacterSearchAndAdd uses sonner success toast for add flow", () => {
  const source = readComponent("CharacterSearchAndAdd.tsx");
  assert.match(source, /import\s+\{\s*toast\s*\}\s+from\s+"sonner"/);
  assert.match(source, /toast\.success\(`Successfully added/);
});

test("CharacterListOptimized uses sonner success toast for delete flow", () => {
  const source = readComponent("CharacterListOptimized.tsx");
  assert.match(source, /import\s+\{\s*toast\s*\}\s+from\s+"sonner"/);
  assert.match(source, /toast\.success\(`Successfully deleted/);
});
