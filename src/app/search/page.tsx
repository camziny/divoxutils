import React from "react";
import UserListWrapper from "@/app/components/UserListWrapper";
import UserAndCharacterNameSearch from "@/app/components/UserAndCharacterSearchResults";

export const metadata = {
  title: "Search Users - divoxutils",
};

const SearchPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center justify-center pt-10 pb-4">
        <div className="w-full max-w-xl lg:max-w-2xl px-2">
          <UserAndCharacterNameSearch />
        </div>
      </div>
      <div className="w-full">
        <UserListWrapper />
      </div>
    </div>
  );
};

export default SearchPage;
