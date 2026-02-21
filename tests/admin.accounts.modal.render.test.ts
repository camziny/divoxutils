import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AccountDeleteConfirmModal, {
  SearchResult,
  getDeleteConfirmName,
  isDeleteConfirmMatch,
} from "../src/app/admin/accounts/AccountDeleteConfirmModal";

const sampleUser: SearchResult = {
  id: 1,
  clerkUserId: "user_123",
  name: "PlayerOne",
  email: "player@example.com",
  characters: [
    {
      id: 9,
      characterName: "Valyn",
      className: "Armsman",
      realm: "Albion",
      totalRealmPoints: 123456,
    },
  ],
  identityLinks: [{ provider: "discord", providerUserId: "99887766" }],
  groupCount: 2,
  claimCount: 1,
};

test("getDeleteConfirmName prefers username over clerk id", () => {
  assert.equal(getDeleteConfirmName(sampleUser), "PlayerOne");
  assert.equal(
    getDeleteConfirmName({
      ...sampleUser,
      name: null,
    }),
    "user_123"
  );
  assert.equal(getDeleteConfirmName(null), "");
});

test("isDeleteConfirmMatch is case-insensitive and requires non-empty input", () => {
  assert.equal(isDeleteConfirmMatch("", "PlayerOne"), false);
  assert.equal(isDeleteConfirmMatch("playerone", "PlayerOne"), true);
  assert.equal(isDeleteConfirmMatch("PLAYERONE", "PlayerOne"), true);
  assert.equal(isDeleteConfirmMatch("player", "PlayerOne"), false);
});

test("AccountDeleteConfirmModal renders account details", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: sampleUser,
      confirmInput: "",
      deleting: false,
      error: null,
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  assert.match(html, /Delete account/);
  assert.match(html, /player@example\.com/);
  assert.match(html, /user_123/);
  assert.match(html, /99887766/);
  assert.match(html, /1/);
  assert.match(html, /Show characters/);
  assert.doesNotMatch(html, /Valyn/);
});

test("AccountDeleteConfirmModal renders summary counts", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: sampleUser,
      confirmInput: "",
      deleting: false,
      error: null,
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  assert.match(html, /Characters/);
  assert.match(html, /Groups/);
  assert.match(html, /Claims/);
});

test("AccountDeleteConfirmModal keeps delete button disabled until input matches", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: sampleUser,
      confirmInput: "wrong-name",
      deleting: false,
      error: null,
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  assert.match(html, /disabled=""/);
});

test("AccountDeleteConfirmModal enables delete button when input matches", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: sampleUser,
      confirmInput: "playerone",
      deleting: false,
      error: null,
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  const deleteButtonPattern = /disabled=""[^>]*>Delete<\/button>/;
  assert.doesNotMatch(html, deleteButtonPattern);
});

test("AccountDeleteConfirmModal shows deleting state and inline error", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: sampleUser,
      confirmInput: "PlayerOne",
      deleting: true,
      error: "Delete failed.",
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  assert.match(html, /Deleting\.\.\./);
  assert.match(html, /Delete failed\./);
});

test("AccountDeleteConfirmModal hides character toggle when no characters", () => {
  const html = renderToStaticMarkup(
    React.createElement(AccountDeleteConfirmModal, {
      confirmTarget: { ...sampleUser, characters: [] },
      confirmInput: "",
      deleting: false,
      error: null,
      onClose: () => {},
      onConfirmInputChange: () => {},
      onDelete: () => {},
    })
  );

  assert.doesNotMatch(html, /Show characters/);
});
