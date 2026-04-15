import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

test("legacy test route pages are removed", () => {
  assert.equal(existsSync("src/app/draft/test/page.tsx"), false);
  assert.equal(existsSync("src/app/draft-history/test/page.tsx"), false);
  assert.equal(existsSync("src/app/draft-history/link-test/page.tsx"), false);
  assert.equal(existsSync("src/app/testingboards999/page.tsx"), false);
  assert.equal(existsSync("src/app/support-modal-test/page.tsx"), false);
  assert.equal(existsSync("src/app/test-loading/page.tsx"), false);
});

test("canonical test route pages remain in place", () => {
  assert.equal(existsSync("src/app/test/page.tsx"), true);
  assert.equal(existsSync("src/app/test/support-modal/page.tsx"), true);
  assert.equal(existsSync("src/app/test/loading/page.tsx"), true);
  assert.equal(existsSync("src/app/test/draft/page.tsx"), true);
  assert.equal(existsSync("src/app/test/draft-history/page.tsx"), true);
  assert.equal(existsSync("src/app/test/draft-history/link-card/page.tsx"), true);
});

test("support prompt exclusions use canonical test support route", () => {
  const source = readFileSync("src/components/support/supportPromptRules.ts", "utf8");
  assert.equal(source.includes('pathname === "/test/support-modal"'), true);
  assert.equal(source.includes('pathname === "/support-modal-test"'), false);
});
