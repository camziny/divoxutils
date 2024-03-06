import React from "react";
import UserSearchResults from "@/app/components/UserSearchResults";

export const metadata = {
  title: "Search Users - divoxutils",
};

const SearchPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen">
      <UserSearchResults />
    </div>
  );
};

export default SearchPage;
