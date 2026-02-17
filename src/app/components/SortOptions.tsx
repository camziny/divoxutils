"use client";
import React from "react";
import { Button } from "@/components/ui/button";

const sortOptions = {
  realm: "Realm",
  "rank-high-to-low": "Rank (desc)",
  "rank-low-to-high": "Rank (asc)",
};

type SortOptionKeys = keyof typeof sortOptions;

const SortOptions: React.FC<{
  sortOption: string;
  onSortChange: (option: string) => void;
}> = ({ sortOption, onSortChange }) => {
  const entries = Object.entries(sortOptions);

  return (
    <div className="flex items-center justify-center mb-4">
      <div className="inline-flex">
        {entries.map(([key, label], index) => (
          <Button
            key={key}
            onClick={() => onSortChange(key)}
            variant={sortOption === key ? "default" : "secondary"}
            size="sm"
            className={`h-auto py-1.5 text-[13px] ${
              index === 0
                ? "rounded-r-none border-r border-r-gray-700/50"
                : index === entries.length - 1
                ? "rounded-l-none"
                : "rounded-none border-r border-r-gray-700/50"
            }`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SortOptions;
