import React from "react";
import { TableRow, TableCell } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ExpandCircleDownIcon from "@mui/icons-material/ExpandCircleDown";

const MobileCharacterTileSkeleton = () => {
  return (
    <TableRow className="rounded-xl overflow-hidden shadow-md bg-gray-800">
      <TableCell className="p-0.5 w-8">
        <IconButton disabled size="small">
          <ExpandCircleDownIcon className="text-white text-xxs" />
        </IconButton>
      </TableCell>
      <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
        <div className="animate-pulse bg-gray-700 rounded h-4 w-3/4"></div>
      </TableCell>
      <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
        <div className="animate-pulse bg-gray-700 rounded h-4 w-3/4"></div>
      </TableCell>
      <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
        <div className="animate-pulse bg-gray-700 rounded h-4 w-3/4"></div>
      </TableCell>
      <TableCell className="p-0.5 w-8"></TableCell>
    </TableRow>
  );
};

export default MobileCharacterTileSkeleton;
