import React, { Suspense } from "react";
import UserListWrapper from "@/app/components/UserListWrapper";
import UserAndCharacterNameSearch from "@/app/components/UserAndCharacterSearchResults";
import SearchUserListToggle from "@/app/components/SearchUserListToggle";
import UserListSkeleton from "@/app/components/UserListSkeleton";
import { SearchProvider } from "./SearchContext";
import { shouldHideUserListForQuery } from "./urlState";

export const metadata = {
  title: "Search Users - divoxutils",
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
