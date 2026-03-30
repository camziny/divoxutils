import test from "node:test";
import assert from "node:assert/strict";
import { resolveInitialDesktopLayout } from "../src/utils/characterListLayout";

test("resolveInitialDesktopLayout uses query param when valid", () => {
  const layout = resolveInitialDesktopLayout({
    searchParams: { layout: "realm-grid" },
    preferredDesktopLayout: "table",
  });

  assert.equal(layout, "realm-grid");
});

test("resolveInitialDesktopLayout falls back to preference when query is invalid", () => {
  const layout = resolveInitialDesktopLayout({
    searchParams: { layout: "invalid-layout" },
    preferredDesktopLayout: "realm-grid",
  });

  assert.equal(layout, "realm-grid");
});

test("resolveInitialDesktopLayout defaults to table when both are missing/invalid", () => {
  const layout = resolveInitialDesktopLayout({
    searchParams: { layout: "legacy-view" },
    preferredDesktopLayout: null,
  });

  assert.equal(layout, "table");
});
