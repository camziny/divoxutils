import test from "node:test";
import assert from "node:assert/strict";
import { hasDraftParticipantWithDiscordUserId } from "../src/server/discordIdentity";

test("hasDraftParticipantWithDiscordUserId returns true when id exists", () => {
  const drafts = [
    {
      players: [{ discordUserId: "111" }, { discordUserId: "222" }],
    },
  ];

  assert.equal(hasDraftParticipantWithDiscordUserId(drafts, "222"), true);
});

test("hasDraftParticipantWithDiscordUserId trims incoming id", () => {
  const drafts = [
    {
      players: [{ discordUserId: "333" }],
    },
  ];

  assert.equal(hasDraftParticipantWithDiscordUserId(drafts, " 333 "), true);
});

test("hasDraftParticipantWithDiscordUserId returns false when id missing", () => {
  const drafts = [
    {
      players: [{ discordUserId: "444" }],
    },
  ];

  assert.equal(hasDraftParticipantWithDiscordUserId(drafts, "999"), false);
});

test("hasDraftParticipantWithDiscordUserId returns false for empty id", () => {
  const drafts = [
    {
      players: [{ discordUserId: "555" }],
    },
  ];

  assert.equal(hasDraftParticipantWithDiscordUserId(drafts, "   "), false);
});
