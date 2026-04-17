import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLiveBanSummaryGroups,
  splitBansForLiveSummary,
} from "../src/app/draft/[id]/_components/banSummary";

test("splitBansForLiveSummary separates captain and auto bans", () => {
  const bans = [
    { _id: "b1", _creationTime: 1, draftId: "d1", team: 1 as const, className: "Cleric", source: "captain" as const },
    { _id: "b2", _creationTime: 2, draftId: "d1", team: 2 as const, className: "Bard", source: "captain" as const },
    { _id: "b3", _creationTime: 3, draftId: "d1", team: 1 as const, className: "Paladin", source: "auto" as const },
  ] as any;

  const split = splitBansForLiveSummary(bans);
  assert.deepEqual(split.team1.map((ban) => ban.className), ["Cleric"]);
  assert.deepEqual(split.team2.map((ban) => ban.className), ["Bard"]);
  assert.deepEqual(split.auto.map((ban) => ban.className), ["Paladin"]);
});

test("splitBansForLiveSummary treats legacy bans without source as captain bans", () => {
  const bans = [
    { _id: "b1", _creationTime: 1, draftId: "d1", team: 1 as const, className: "Cleric" },
    { _id: "b2", _creationTime: 2, draftId: "d1", team: 2 as const, className: "Bard" },
  ] as any;

  const split = splitBansForLiveSummary(bans);
  assert.deepEqual(split.team1.map((ban) => ban.className), ["Cleric"]);
  assert.deepEqual(split.team2.map((ban) => ban.className), ["Bard"]);
  assert.deepEqual(split.auto.map((ban) => ban.className), []);
});

test("buildLiveBanSummaryGroups always returns T1/T2/Auto in order", () => {
  const bans = [
    { _id: "b1", _creationTime: 1, draftId: "d1", team: 1 as const, className: "Cleric", source: "captain" as const },
    { _id: "b2", _creationTime: 2, draftId: "d1", team: 1 as const, className: "Paladin", source: "auto" as const },
  ] as any;

  const groups = buildLiveBanSummaryGroups(bans);
  assert.deepEqual(groups.map((group) => group.label), ["T1", "T2", "Auto"]);
  assert.deepEqual(groups[0].classNames, ["Cleric"]);
  assert.deepEqual(groups[1].classNames, []);
  assert.deepEqual(groups[2].classNames, ["Paladin"]);
});

test("live ban summary text snapshot stays stable", () => {
  const bans = [
    { _id: "b1", _creationTime: 1, draftId: "d1", team: 1 as const, className: "Cleric", source: "captain" as const },
    { _id: "b2", _creationTime: 2, draftId: "d1", team: 2 as const, className: "Bard", source: "captain" as const },
    { _id: "b3", _creationTime: 3, draftId: "d1", team: 1 as const, className: "Paladin", source: "auto" as const },
  ] as any;

  const snapshot = buildLiveBanSummaryGroups(bans)
    .map((group) =>
      `${group.label}: ${group.classNames.length > 0 ? group.classNames.join(", ") : "--"}`
    )
    .join(" | ");

  assert.equal(snapshot, "T1: Cleric | T2: Bard | Auto: Paladin");
});
