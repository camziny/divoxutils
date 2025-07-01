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
    <div className="flex flex-col sm:flex-row items-center justify-center mb-6 space-y-2 sm:space-y-0">
      <ButtonGroup className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        {Object.entries(sortOptions).map(([key, label]) => (
          <Button
            key={key}
            onClick={() => onSortChange(key)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors duration-200
              ${sortOption === key 
                ? 'bg-indigo-600 text-white' 
                : 'bg-transparent text-gray-300 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default SortOptions;
