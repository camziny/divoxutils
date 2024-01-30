"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserList from "./UserList";
import useDebounce from "./UseDebounce";
import { Input } from "@nextui-org/react";

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
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter;

  useEffect(() => {
    const fetchUsers = async () => {
      if (debouncedQuery.trim() === "") {
        setSearchResults([]);
        setSearchPerformed(false);
        setIsLoading(false);
        return;
      }

      setSearchPerformed(true);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users?name=${debouncedQuery}`);
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
    fetchUsers();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col items-center justify-center my-10 bg-gray-900">
      <form className="flex justify-center mb-6 w-full max-w-xs">
        <Input
          size="sm"
          type="text"
          placeholder="Search user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          classNames={{
            label: "text-gray-500 dark:text-gray-300",
            input: [
              "bg-transparent",
              "text-gray-800 dark:text-gray-200",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            ],
            innerWrapper: "bg-transparent",
            inputWrapper: [
              "shadow-xl",
              "bg-gray-800",
              "dark:bg-gray-700",
              "hover:bg-gray-700 dark:hover:bg-gray-600",
              "group-data-[focused=true]:bg-gray-800 dark:group-data-[focused=true]:bg-gray-700",
              "border border-indigo-500",
              "focus:border-indigo-600",
              "!cursor-text",
            ],
          }}
        />
      </form>
      <div className="w-full max-w-xs">
        {isLoading ? (
          <div className="flex justify-center items-center"></div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
            <Link key={user.id} href={`user/${user.name}/characters`}>
              <div className="text-indigo-400 text-2xl cursor-pointer p-4 rounded-md bg-gray-800 hover:bg-gray-600 transition-colors flex justify-center items-center">
                {user.name}
              </div>
            </Link>
          ))
        ) : searchPerformed ? (
          <p className="text-gray-500 text-center">No users found</p>
        ) : null}
      </div>
      <UserList />
    </div>
  );
}
