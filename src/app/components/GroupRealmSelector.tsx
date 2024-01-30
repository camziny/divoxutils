import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { GroupRealmSelectorProps } from "@/utils/group";

const GroupRealmSelector: React.FC<GroupRealmSelectorProps> = ({
  selectedRealm,
  setSelectedRealm,
}) => {
  const realms = ["Albion", "Hibernia", "Midgard", "PvP"];

  return (
    <div className="flex justify-center items-center">
      {" "}
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" className="text-white text-lg py-3 px-6">
            {" "}
            {selectedRealm}
            <KeyboardArrowDownIcon />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          variant="faded"
          aria-label="Select Realm"
          className="bg-gray-900 text-indigo-400 max-h-60 overflow-y-auto w-64"
        >
          {realms.map((realm) => (
            <DropdownItem
              key={realm}
              onClick={() =>
                setSelectedRealm(realm === "Select Realm" ? "PvP" : realm)
              }
              className="flex items-center justify-between px-4 py-2 text-lg"
            >
              <span className="flex-1 truncate text-lg">{realm}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default GroupRealmSelector;
