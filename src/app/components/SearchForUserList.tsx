"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchForUserList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/search?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="relative max-w-[45ch]">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchTerm}
          placeholder="Search"
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
        />
        <button type="submit" className="hidden">
          Search
        </button>
      </form>
    </div>
  );
}
