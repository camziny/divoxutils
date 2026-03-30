import test from "node:test";
import assert from "node:assert/strict";
import {
  getDesktopLayoutLabel,
  shouldApplyRealmGridRankSort,
  shouldShowSaveLayoutHint,
} from "../src/utils/characterListLayoutUi";

test("getDesktopLayoutLabel maps table to Classic and realm-grid to Compact", () => {
  assert.equal(getDesktopLayoutLabel("table"), "Classic");
  assert.equal(getDesktopLayoutLabel("realm-grid"), "Compact");
});

test("shouldShowSaveLayoutHint only appears for signed-in users with non-preferred layout", () => {
  assert.equal(
    shouldShowSaveLayoutHint({
      isSignedIn: true,
      desktopLayout: "realm-grid",
      savedPreference: "table",
    }),
    true
  );

  assert.equal(
    shouldShowSaveLayoutHint({
      isSignedIn: true,
      desktopLayout: "table",
      savedPreference: "table",
    }),
    false
  );

  assert.equal(
    shouldShowSaveLayoutHint({
      isSignedIn: false,
      desktopLayout: "realm-grid",
      savedPreference: "table",
    }),
    false
  );
});

test("shouldApplyRealmGridRankSort is desktop-only for compact realm layout", () => {
  assert.equal(
    shouldApplyRealmGridRankSort({
      isDesktopViewport: true,
      desktopLayout: "realm-grid",
      sortOption: "realm",
      columnSort: null,
    }),
    true
  );

  assert.equal(
    shouldApplyRealmGridRankSort({
      isDesktopViewport: false,
      desktopLayout: "realm-grid",
      sortOption: "realm",
      columnSort: null,
    }),
    false
  );

  assert.equal(
    shouldApplyRealmGridRankSort({
      isDesktopViewport: true,
      desktopLayout: "table",
      sortOption: "realm",
      columnSort: null,
    }),
    false
  );

  assert.equal(
    shouldApplyRealmGridRankSort({
      isDesktopViewport: true,
      desktopLayout: "realm-grid",
      sortOption: "rank-high-to-low",
      columnSort: null,
    }),
    false
  );
});
