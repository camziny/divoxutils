import test from "node:test";
import assert from "node:assert/strict";
import { resolvePvpClassKey } from "../src/app/draft/_lib/constants";

test("resolvePvpClassKey tags Mauler with its realm in pvp drafts", () => {
  assert.equal(resolvePvpClassKey(true, "Mauler", "Albion"), "Mauler (Alb)");
  assert.equal(resolvePvpClassKey(true, "Mauler", "Midgard"), "Mauler (Mid)");
  assert.equal(resolvePvpClassKey(true, "Mauler", "Hibernia"), "Mauler (Hib)");
});

test("resolvePvpClassKey leaves non-Mauler classes untouched in pvp drafts", () => {
  assert.equal(resolvePvpClassKey(true, "Cleric", "Albion"), "Cleric");
  assert.equal(resolvePvpClassKey(true, "Bard", "Hibernia"), "Bard");
});

test("resolvePvpClassKey leaves Mauler untagged for traditional drafts", () => {
  assert.equal(resolvePvpClassKey(false, "Mauler", "Albion"), "Mauler");
  assert.equal(resolvePvpClassKey(false, "Mauler", "Midgard"), "Mauler");
});
