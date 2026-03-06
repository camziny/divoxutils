import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchUrl, shouldHideUserListForQuery } from "../src/app/search/urlState";

test("shouldHideUserListForQuery hides list for trimmed query length >= 3", () => {
  assert.equal(shouldHideUserListForQuery("abc"), true);
  assert.equal(shouldHideUserListForQuery("  abc  "), true);
});

test("shouldHideUserListForQuery keeps list for short or empty queries", () => {
  assert.equal(shouldHideUserListForQuery(""), false);
  assert.equal(shouldHideUserListForQuery("ab"), false);
  assert.equal(shouldHideUserListForQuery("  a "), false);
  assert.equal(shouldHideUserListForQuery(null), false);
  assert.equal(shouldHideUserListForQuery(undefined), false);
});

test("buildSearchUrl sets q and preserves all other params including section", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "section=C&foo=1",
    debouncedQuery: "  kenco ",
  });

  assert.equal(result.didChange, true);
  assert.equal(result.nextUrl, "/search?section=C&foo=1&q=kenco");
});

test("buildSearchUrl removes q and preserves section when query is cleared", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "q=kenco&section=C&foo=1",
    debouncedQuery: "   ",
  });

  assert.equal(result.didChange, true);
  assert.equal(result.nextUrl, "/search?section=C&foo=1");
});

test("buildSearchUrl no-ops when q value has not changed", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "foo=1&q=kenco",
    debouncedQuery: "kenco",
  });

  assert.equal(result.didChange, false);
});

test("buildSearchUrl no-ops when section changes but q is the same", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "q=kenco&section=C",
    debouncedQuery: "kenco",
  });

  assert.equal(result.didChange, false);
});

test("buildSearchUrl preserves section for short queries", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "section=B&foo=1",
    debouncedQuery: "ab",
  });

  assert.equal(result.didChange, true);
  assert.equal(result.nextUrl, "/search?section=B&foo=1&q=ab");
});

test("buildSearchUrl returns clean pathname when all params removed", () => {
  const result = buildSearchUrl({
    pathname: "/search",
    currentSearch: "q=kenco",
    debouncedQuery: "",
  });

  assert.equal(result.didChange, true);
  assert.equal(result.nextUrl, "/search");
});
