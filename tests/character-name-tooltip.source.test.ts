import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src", "app", "components");

const readComponent = (fileName: string) =>
  readFileSync(path.join(root, fileName), "utf8");

test("CharacterTile uses shadcn tooltip for name hover", () => {
  const source = readComponent("CharacterTile.tsx");
  assert.match(source, /from\s+"@\/components\/ui\/tooltip"/);
  assert.match(source, /<TooltipProvider>/);
  assert.match(source, /<TooltipTrigger asChild>/);
  assert.match(source, /<TooltipContent>\{characterDetails\.heraldName\}<\/TooltipContent>/);
  assert.doesNotMatch(source, /from\s+"@mui\/material".*Tooltip/);
  assert.doesNotMatch(source, /styled\(\(\{ className, \.\.\.props \}\)\s*=>\s*\(\s*<Tooltip/);
});

test("DesktopCharacterCard uses shadcn tooltip for truncated name", () => {
  const source = readComponent("DesktopCharacterCard.tsx");
  assert.match(source, /from\s+"@\/components\/ui\/tooltip"/);
  assert.match(source, /<TooltipProvider>/);
  assert.match(source, /<TooltipTrigger asChild>/);
  assert.match(
    source,
    /<TooltipContent>\{characterDetails\.heraldName \|\| "Unknown"\}<\/TooltipContent>/
  );
});
