import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SortOptions from "../src/app/components/SortOptions";

test("SortOptions renders all sort labels", () => {
  const html = renderToStaticMarkup(
    React.createElement(SortOptions, {
      sortOption: "realm",
      onSortChange: () => {},
    })
  );

  assert.match(html, /Realm/);
  assert.match(html, /Rank \(desc\)/);
  assert.match(html, /Rank \(asc\)/);
});

test("SortOptions applies active and inactive button styles", () => {
  const html = renderToStaticMarkup(
    React.createElement(SortOptions, {
      sortOption: "rank-high-to-low",
      onSortChange: () => {},
    })
  );

  assert.match(html, /bg-indigo-600 text-white/);
  assert.match(html, /bg-gray-800 text-gray-300/);
  assert.match(html, /rounded-r-none/);
  assert.match(html, /rounded-none/);
  assert.match(html, /rounded-l-none/);
});
