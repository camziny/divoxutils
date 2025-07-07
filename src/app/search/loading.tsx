import React from "react";
import UserListSkeleton from "../components/UserListSkeleton";

export default function SearchLoading() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center justify-center pt-10 pb-4">
        <div className="w-full max-w-xl lg:max-w-2xl px-2">
          <div className="animate-pulse bg-gray-700 rounded-lg h-12 w-full"></div>
        </div>
      </div>
      <div className="w-full">
        <UserListSkeleton />
      </div>
    </div>
  );
} 