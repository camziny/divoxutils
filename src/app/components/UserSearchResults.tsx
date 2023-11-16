"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import UserList from "./UserList";
import CancelIcon from "@mui/icons-material/Cancel";

type User = {
  id: number;
  clerkUserId: string;
  name: string;
};
type UserSearchResultsProps = {
  users: User[];
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSearchPerformed(true);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?name=${query}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const users = await response.json();
      setSearchResults(users);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSearch = () => {
    setQuery("");
    setSearchResults([]);
    setSearchPerformed(false);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center my-10 bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="flex justify-center mb-6 w-full max-w-xs"
      >
        <input
          className="border-2 border-gray-300 rounded-full px-4 py-2 mr-3 w-full focus:outline-none focus:border-blue-500 text-gray-700 bg-white"
          type="text"
          placeholder="Search user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="bg-indigo-500 text-white rounded-full px-4 py-2 hover:bg-indigo-600"
          type="submit"
        >
          Search
        </button>
      </form>
      {searchPerformed && (
        <button
          onClick={cancelSearch}
          className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 border border-indigo-700 rounded shadow mb-4 rounded-full"
        >
          <CancelIcon className="mr-2" />
          <span>Cancel</span>
        </button>
      )}
      <div className="w-full max-w-xs">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <CircularProgress style={{ color: "#6366F1" }} />{" "}
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
            <Link key={user.id} href={`/users/${user.clerkUserId}/characters`}>
              <div className="text-indigo-400 text-2xl cursor-pointer p-4 rounded-md bg-gray-800 hover:bg-gray-600 transition-colors flex justify-center items-center">
                {user.name}
              </div>
            </Link>
          ))
        ) : searchPerformed ? (
          <p className="text-gray-500">No users found</p>
        ) : null}
      </div>
      <UserList />
    </div>
  );
}
