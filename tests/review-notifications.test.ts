import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDraftReviewEmail,
  getAdminReviewRecipients,
} from "../convex/reviewNotifications";

test("review notification recipients are fixed to cameronziny@gmail.com", () => {
  assert.deepEqual(getAdminReviewRecipients(), ["cameronziny@gmail.com"]);
});

test("review notification email includes admin moderation link", () => {
  const previousBaseUrl = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = "https://divoxutils.com";
  try {
    const payload = buildDraftReviewEmail({
      shortId: "abc123",
      winnerTeam: 2,
      discordGuildName: "GuildName",
      discordGuildId: "g-1",
      createdByDisplayName: "Creator",
      createdBy: "user_1",
      setScore: "3-2",
    });
    assert.match(
      payload.text,
      /https:\/\/divoxutils\.com\/admin\/drafts\?draft=abc123/
    );
    assert.match(
      payload.html,
      /href="https:\/\/divoxutils\.com\/admin\/drafts\?draft=abc123"/
    );
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = previousBaseUrl;
    }
  }
});

