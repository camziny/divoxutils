"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SearchState = {
  isSearchActive: boolean;
  setSearchActive: (active: boolean) => void;
};

const SearchContext = createContext<SearchState>({
  isSearchActive: false,
  setSearchActive: () => {},
});

export function SearchProvider({
  children,
  initialIsSearchActive = false,
}: {
  children: ReactNode;
  initialIsSearchActive?: boolean;
}) {
  const [isSearchActive, setSearchActive] = useState(initialIsSearchActive);
  const value = useMemo(
    () => ({ isSearchActive, setSearchActive }),
    [isSearchActive]
  );
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearchActive() {
  return useContext(SearchContext);
}
