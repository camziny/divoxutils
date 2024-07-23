"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ButtonGroup, Button } from "@nextui-org/react";

const sortOptions = {
  realm: "Realm",
  "rank-high-to-low": "Rank (desc)",
  "rank-low-to-high": "Rank (asc)",
};

type SortOptionKeys = keyof typeof sortOptions;

const SortOptions = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSortOption = (searchParams?.get("sortOption") ||
    "realm") as SortOptionKeys;
  const [sortOption, setSortOption] =
    useState<SortOptionKeys>(initialSortOption);

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("sortOption", sortOption);
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
    router.refresh();
  }, [sortOption, router]);

  const handleSortChange = (option: SortOptionKeys) => {
    setSortOption(option);
  };

  return (
    <div className="flex flex-row items-center mb-4">
      <ButtonGroup className="relative">
        {Object.entries(sortOptions).map(([key, label]) => (
          <Button
            key={key}
            onClick={() => handleSortChange(key as SortOptionKeys)}
            className={`bg-gray-800 text-indigo-400 ${
              sortOption === key ? "border-2 border-indigo-500" : ""
            }`}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default SortOptions;
