import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Progress } from "../src/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "../src/components/ui/toggle-group";

test("Progress renders clamped width style from value", () => {
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 42 }));
  assert.match(html, /width:42%/);
});

test("Progress clamps values above 100", () => {
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 180 }));
  assert.match(html, /width:100%/);
});

test("ToggleGroup marks selected item as active", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ToggleGroup,
      {
        value: "dbPerKill",
        onValueChange: () => {},
      },
      React.createElement(ToggleGroupItem, { value: "dbPerKill" }, "DB / Kill"),
      React.createElement(ToggleGroupItem, { value: "skPerKill" }, "SK / Kill")
    )
  );

  assert.match(html, /bg-gray-700 text-white shadow-sm/);
  assert.match(html, /text-gray-500 hover:text-gray-300/);
});
