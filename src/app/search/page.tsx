import React, { Suspense } from "react";
import type { Metadata } from "next";
import UserListWrapper from "@/app/components/UserListWrapper";
import UserAndCharacterNameSearch from "@/app/components/UserAndCharacterSearchResults";
import SearchUserListToggle from "@/app/components/SearchUserListToggle";
import UserListSkeleton from "@/app/components/UserListSkeleton";
import { SearchProvider } from "./SearchContext";
import { shouldHideUserListForQuery } from "./urlState";

export const metadata: Metadata = {
  title: "Search Users - divoxutils",
  description:
    "Search for players and characters on divoxutils to quickly find profiles, progress, and related stats.",
  alternates: {
    canonical: "https://divoxutils.com/search",
  },
  openGraph: {
    title: "Search Users - divoxutils",
    description:
      "Search players and characters on divoxutils.",
    url: "https://divoxutils.com/search",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Users - divoxutils",
    description: "Search players and characters on divoxutils.",
    images: ["/wh-big.png"],
  },
};

interface SearchPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const SearchPage = ({ searchParams }: SearchPageProps) => {
  const resolvedSearchParams = searchParams ?? {};
  const queryParam = resolvedSearchParams.q;
  const initialQuery = Array.isArray(queryParam) ? queryParam[0] : queryParam;
  const initialIsSearchActive = shouldHideUserListForQuery(initialQuery);

  return (
    <div className="bg-gray-900 min-h-screen">
      <SearchProvider initialIsSearchActive={initialIsSearchActive}>
        <div className="flex flex-col items-center justify-center pt-10 pb-4">
          <div className="w-full max-w-xl lg:max-w-2xl px-2">
            <Suspense>
              <UserAndCharacterNameSearch />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<UserListSkeleton />}>
          <SearchUserListToggle>
            <UserListWrapper />
          </SearchUserListToggle>
        </Suspense>
      </SearchProvider>
    </div>
  );
};

export default SearchPage;
