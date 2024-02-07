import React, { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { GroupSortAndFilterProps, SortOption } from "@/utils/group";

const GroupSortAndFilter: React.FC<GroupSortAndFilterProps> = ({
  setSortOption,
  currentSortOption,
}) => {
  const sortOptions: SortOption[] = [
    "RR High to Low",
    "RR Low to High",
    "Class Name",
  ];
  const [selectedOption, setSelectedOption] = useState<SortOption>(
    currentSortOption || "RR High to Low"
  );

  const handleOptionSelect = (option: SortOption) => {
    setSelectedOption(option);
    setSortOption(option);
  };

  return (
    <div className="flex justify-center items-center">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" className="text-white text-lg py-3 px-6">
            {selectedOption}
            <KeyboardArrowDownIcon />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          variant="faded"
          aria-label="Sort Characters"
          className="bg-gray-900 text-indigo-400 max-h-60 overflow-y-auto w-64"
        >
          {sortOptions.map((option) => (
            <DropdownItem
              key={option}
              onClick={() => handleOptionSelect(option)}
              className={`flex items-center justify-between px-4 py-2 text-lg ${
                selectedOption === option ? "bg-gray-700" : ""
              }`}
            >
              <span className="flex-1 truncate text-lg">{option}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default GroupSortAndFilter;
