"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchForUserList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/search?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="relative max-w-[45ch]">
      <form onSubmit={handleSearch} role="search" aria-label="Search users">
        <label htmlFor="search-user-list-input" className="sr-only">
          Search users
        </label>
        <input
          id="search-user-list-input"
          name="searchUserList"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={searchTerm}
          placeholder="Search"
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        />
        <button type="submit" className="hidden">
          Search
        </button>
      </form>
    </div>
  );
}
