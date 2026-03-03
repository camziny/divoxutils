import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeFightEditor,
  createEmptyFightRow,
  toFightEditorRows,
  type FightEditorPlayer,
} from "../src/app/admin/drafts/fightEditorUtils";

const draftedPlayers: FightEditorPlayer[] = [
  { _id: "p1", displayName: "Alice", team: 1 },
  { _id: "p2", displayName: "Bob", team: 1 },
  { _id: "p3", displayName: "Cara", team: 2 },
  { _id: "p4", displayName: "Dane", team: 2 },
];

test("createEmptyFightRow initializes blank classes and no winner", () => {
  const row = createEmptyFightRow(draftedPlayers);
  assert.equal(row.winnerTeam, null);
  assert.equal(row.classesByPlayer.p1, "");
  assert.equal(row.classesByPlayer.p4, "");
});

test("toFightEditorRows creates one empty row when draft has no fights", () => {
  const rows = toFightEditorRows({
    players: draftedPlayers,
    fights: [],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].winnerTeam, null);
  assert.equal(rows[0].classesByPlayer.p1, "");
});

test("toFightEditorRows maps sorted fights and class snapshots", () => {
  const rows = toFightEditorRows({
    players: draftedPlayers,
    fights: [
      {
        fightNumber: 2,
        winnerTeam: 2,
        classesByPlayer: [
          { playerId: "p1", className: "Cleric" },
          { playerId: "p2", className: "Armsman" },
          { playerId: "p3", className: "Bard" },
          { playerId: "p4", className: "Healer" },
        ],
      },
      {
        fightNumber: 1,
        winnerTeam: 1,
        classesByPlayer: [
          { playerId: "p1", className: "Armsman" },
          { playerId: "p2", className: "Cleric" },
          { playerId: "p3", className: "Bard" },
          { playerId: "p4", className: "Healer" },
        ],
      },
    ],
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].winnerTeam, 1);
  assert.equal(rows[1].winnerTeam, 2);
  assert.equal(rows[0].classesByPlayer.p1, "Armsman");
});

test("analyzeFightEditor reports first missing winner", () => {
  const rows = [createEmptyFightRow(draftedPlayers)];
  const analysis = analyzeFightEditor(rows, draftedPlayers);
  assert.equal(analysis.isComplete, false);
  assert.equal(analysis.firstIssue?.fightIndex, 0);
  assert.match(analysis.firstIssue?.message ?? "", /set winner/i);
});

test("analyzeFightEditor reports first missing class with player name", () => {
  const rows = [
    {
      winnerTeam: 1 as const,
      classesByPlayer: {
        p1: "Armsman",
        p2: "",
        p3: "Bard",
        p4: "Healer",
      },
    },
  ];
  const analysis = analyzeFightEditor(rows, draftedPlayers);
  assert.equal(analysis.isComplete, false);
  assert.match(analysis.firstIssue?.message ?? "", /Bob class not set/);
});

test("analyzeFightEditor rejects fights after clinch", () => {
  const fullClassRow = (winnerTeam: 1 | 2) => ({
    winnerTeam,
    classesByPlayer: {
      p1: "Armsman",
      p2: "Cleric",
      p3: "Bard",
      p4: "Healer",
    },
  });
  const rows = [
    fullClassRow(1),
    fullClassRow(1),
    fullClassRow(1),
    fullClassRow(2),
  ];
  const analysis = analyzeFightEditor(rows, draftedPlayers);
  assert.equal(analysis.scoreReached, true);
  assert.equal(analysis.clinchFightNumber, 3);
  assert.equal(analysis.hasFightsAfterClinch, true);
  assert.equal(analysis.isComplete, false);
  assert.match(analysis.firstIssue?.message ?? "", /already complete/i);
});

test("analyzeFightEditor marks valid first-to-3 set complete", () => {
  const rows = [
    {
      winnerTeam: 1 as const,
      classesByPlayer: {
        p1: "Armsman",
        p2: "Cleric",
        p3: "Bard",
        p4: "Healer",
      },
    },
    {
      winnerTeam: 2 as const,
      classesByPlayer: {
        p1: "Paladin",
        p2: "Armsman",
        p3: "Druid",
        p4: "Shaman",
      },
    },
    {
      winnerTeam: 1 as const,
      classesByPlayer: {
        p1: "Mercenary",
        p2: "Cleric",
        p3: "Bard",
        p4: "Healer",
      },
    },
    {
      winnerTeam: 1 as const,
      classesByPlayer: {
        p1: "Armsman",
        p2: "Friar",
        p3: "Warden",
        p4: "Healer",
      },
    },
  ];
  const analysis = analyzeFightEditor(rows, draftedPlayers);
  assert.equal(analysis.team1Wins, 3);
  assert.equal(analysis.team2Wins, 1);
  assert.equal(analysis.scoreReached, true);
  assert.equal(analysis.hasFightsAfterClinch, false);
  assert.equal(analysis.isComplete, true);
  assert.equal(analysis.firstIssue, null);
});
