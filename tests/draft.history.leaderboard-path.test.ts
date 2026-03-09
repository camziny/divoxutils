import test from "node:test";
import assert from "node:assert/strict";
import {
  getClerkUserIdFromLeaderboardParam,
  getLeaderboardProfileHref,
} from "../src/lib/draftHistoryLeaderboardPath";

test("getLeaderboardProfileHref includes readable slug and encoded id", () => {
  const href = getLeaderboardProfileHref("user_3ALG9MuvJknZxS3tiCIDQKNr3wX", "Lappjevel");
  assert.equal(
    href,
    "/draft-history/leaderboard/lappjevel~user_3ALG9MuvJknZxS3tiCIDQKNr3wX"
  );
});

test("getClerkUserIdFromLeaderboardParam supports slugged and legacy paths", () => {
  assert.equal(
    getClerkUserIdFromLeaderboardParam("lappjevel~user_3ALG9MuvJknZxS3tiCIDQKNr3wX"),
    "user_3ALG9MuvJknZxS3tiCIDQKNr3wX"
  );
  assert.equal(
    getClerkUserIdFromLeaderboardParam("discord-player~discord%3A123456"),
    "discord:123456"
  );
  assert.equal(
    getClerkUserIdFromLeaderboardParam("user_3ALG9MuvJknZxS3tiCIDQKNr3wX"),
    "user_3ALG9MuvJknZxS3tiCIDQKNr3wX"
  );
});

test("getLeaderboardProfileHref falls back to stable player slug", () => {
  assert.equal(
    getLeaderboardProfileHref("discord:123", "   "),
    "/draft-history/leaderboard/player~discord%3A123"
  );
});

test("getClerkUserIdFromLeaderboardParam decodes encoded legacy id", () => {
  assert.equal(
    getClerkUserIdFromLeaderboardParam("discord%3A123456"),
    "discord:123456"
  );
});

test("getClerkUserIdFromLeaderboardParam preserves id suffixes containing separator", () => {
  assert.equal(
    getClerkUserIdFromLeaderboardParam("player~user_abc~suffix"),
    "user_abc~suffix"
  );
});
