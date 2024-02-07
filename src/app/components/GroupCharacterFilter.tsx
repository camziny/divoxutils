import { Checkbox, Spacer } from "@nextui-org/react";
import React, { useState } from "react";
import { ClassType, GroupCharacterFilterProps } from "@/utils/group";

const GroupCharacterFilter: React.FC<GroupCharacterFilterProps> = ({
  onFilterChange,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<ClassType[]>([]);

  const handleFilterChange = (classType: ClassType, checked: boolean) => {
    const newFilters = checked
      ? [...selectedFilters, classType]
      : selectedFilters.filter((type) => type !== classType);

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-wrap justify-center items-center md:space-x-4">
      {(["Tank", "Caster", "Support", "Stealth"] as ClassType[]).map((type) => (
        <div key={type} className="p-2">
          {" "}
          <Checkbox
            checked={selectedFilters.includes(type)}
            onChange={(e) => handleFilterChange(type, e.target.checked)}
            color="default"
          >
            <div className="text-indigo-400 text-lg font-medium">{type}</div>
          </Checkbox>
        </div>
      ))}
    </div>
  );
};

export default GroupCharacterFilter;
