"use client";
import React from "react";
import { ButtonGroup, Button } from "@nextui-org/react";

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
  return (
    <div className="flex flex-row items-center mb-4">
      <ButtonGroup className="relative">
        {Object.entries(sortOptions).map(([key, label]) => (
          <Button
            key={key}
            onClick={() => onSortChange(key)}
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
