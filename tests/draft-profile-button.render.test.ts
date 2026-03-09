import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DraftProfileButton from "../src/app/components/DraftProfileButton";

test("DraftProfileButton renders link and swords icon", () => {
  const href = "/draft-history/leaderboard/test~user_123";
  const html = renderToStaticMarkup(
    React.createElement(DraftProfileButton, {
      href,
    })
  );

  assert.match(html, new RegExp(`href="${href}"`));
  assert.match(html, /lucide-swords/);
});
