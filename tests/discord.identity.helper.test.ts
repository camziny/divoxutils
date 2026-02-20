import test from "node:test";
import assert from "node:assert/strict";
import { hasConnectedDiscordAccount } from "../src/lib/identity/discord";

test("detects discord by provider", () => {
  const result = hasConnectedDiscordAccount([{ provider: "oauth_discord" }]);
  assert.equal(result, true);
});

test("detects discord by providerId", () => {
  const result = hasConnectedDiscordAccount([{ providerId: "discord" }]);
  assert.equal(result, true);
});

test("returns false with no discord account", () => {
  const result = hasConnectedDiscordAccount([{ provider: "google" }]);
  assert.equal(result, false);
});

test("returns false for empty or missing external accounts", () => {
  assert.equal(hasConnectedDiscordAccount([]), false);
  assert.equal(hasConnectedDiscordAccount(undefined), false);
});

test("matches provider in case-insensitive manner", () => {
  const result = hasConnectedDiscordAccount([{ provider: "OAuth_DisCord" }]);
  assert.equal(result, true);
});
