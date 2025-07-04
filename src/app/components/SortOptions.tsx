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
      <ButtonGroup 
        variant="solid"
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg"
      >
        {Object.entries(sortOptions).map(([key, label], index) => (
          <Button
            key={key}
            onClick={() => onSortChange(key)}
            className={`
              px-6 py-3 text-sm font-medium transition-all duration-300 
              ${index === 0 ? 'rounded-l-xl' : ''}
              ${index === Object.entries(sortOptions).length - 1 ? 'rounded-r-xl' : ''}
              ${index !== 0 && index !== Object.entries(sortOptions).length - 1 ? 'rounded-none' : ''}
              ${sortOption === key 
                ? 'bg-indigo-500/90 text-white shadow-md' 
                : 'bg-transparent text-gray-300 hover:text-white hover:bg-gray-700/70'
              }
            `}
            style={{
              border: 'none',
              outline: 'none'
            }}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default SortOptions;
