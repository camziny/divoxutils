"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserList from "./UserList";
import useDebounce from "./UseDebounce";
import { Input } from "@nextui-org/react";
import UserAndCharacterNameSearch from "./UserAndCharacterSearchResults";

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
    <div className="flex flex-col items-center justify-center my-10 bg-gray-900 px-2">
      <div className="w-full max-w-xl lg:max-w-2xl px-2">
        <UserAndCharacterNameSearch />
      </div>
      <UserList />
    </div>
  );
}
