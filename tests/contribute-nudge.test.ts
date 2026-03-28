import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalDayKey,
  isContributePath,
  shouldShowContributeNudge,
} from "../src/app/components/contributeNudge";

test("getLocalDayKey formats date as YYYY-MM-DD", () => {
  const value = getLocalDayKey(new Date("2026-03-27T12:00:00.000Z"));
  assert.equal(value, "2026-03-27");
});

test("isContributePath matches contribute route and subroutes", () => {
  assert.equal(isContributePath("/contribute"), true);
  assert.equal(isContributePath("/contribute/thanks"), true);
  assert.equal(isContributePath("/about"), false);
  assert.equal(isContributePath(null), false);
});

test("shouldShowContributeNudge hides for subscribed users", () => {
  const show = shouldShowContributeNudge({
    pathname: "/leaderboards",
    isSubscribed: true,
    lastAcknowledgedDay: null,
    today: "2026-03-27",
  });
  assert.equal(show, false);
});

test("shouldShowContributeNudge hides on contribute page", () => {
  const show = shouldShowContributeNudge({
    pathname: "/contribute",
    isSubscribed: false,
    lastAcknowledgedDay: null,
    today: "2026-03-27",
  });
  assert.equal(show, false);
});

test("shouldShowContributeNudge hides when already acknowledged today", () => {
  const show = shouldShowContributeNudge({
    pathname: "/leaderboards",
    isSubscribed: false,
    lastAcknowledgedDay: "2026-03-27",
    today: "2026-03-27",
  });
  assert.equal(show, false);
});

test("shouldShowContributeNudge shows for non-subscribed unacknowledged user", () => {
  const show = shouldShowContributeNudge({
    pathname: "/leaderboards",
    isSubscribed: false,
    lastAcknowledgedDay: "2026-03-26",
    today: "2026-03-27",
  });
  assert.equal(show, true);
});
