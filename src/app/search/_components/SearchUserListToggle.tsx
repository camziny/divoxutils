"use client";

import { useSearchActive } from "../_lib/SearchContext";

export default function SearchUserListToggle({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSearchActive } = useSearchActive();

  return <div className={isSearchActive ? "hidden" : "block"}>{children}</div>;
}
