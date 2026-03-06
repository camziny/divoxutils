type BuildSearchUrlArgs = {
  pathname: string;
  currentSearch: string;
  debouncedQuery: string;
};

export function shouldHideUserListForQuery(query: string | null | undefined) {
  return (query ?? "").trim().length >= 3;
}

export function buildSearchUrl({
  pathname,
  currentSearch,
  debouncedQuery,
}: BuildSearchUrlArgs) {
  const nextParams = new URLSearchParams(currentSearch);
  const normalizedQuery = debouncedQuery.trim();
  const currentQ = nextParams.get("q") ?? "";

  if (normalizedQuery.length > 0) {
    nextParams.set("q", normalizedQuery);
  } else {
    nextParams.delete("q");
  }

  const nextQ = nextParams.get("q") ?? "";
  if (nextQ === currentQ) {
    return { didChange: false, nextUrl: "" };
  }

  const nextQueryString = nextParams.toString();
  const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

  return { didChange: true, nextUrl };
}
