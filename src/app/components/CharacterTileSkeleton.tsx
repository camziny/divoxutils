import React from "react";
import { TableRow, TableCell } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ExpandCircleDownIcon from "@mui/icons-material/ExpandCircleDown";

const CharacterTileSkeleton = () => {
  return (
    <TableRow className="rounded-xl overflow-hidden shadow-md bg-gray-800">
      <TableCell className="px-4 py-1 w-12">
        <IconButton disabled size="small">
          <ExpandCircleDownIcon className="text-white text-xxs" />
        </IconButton>
      </TableCell>
      {Array.from({ length: 7 }).map((_, index) => (
        <TableCell
          key={index}
          className="text-white text-xxs font-semibold px-6 py-1"
        >
          <div className="animate-pulse bg-gray-700 rounded h-4 w-3/4"></div>
        </TableCell>
      ))}
      <TableCell className="px-4 py-1 w-12"></TableCell>
    </TableRow>
  );
};

export default CharacterTileSkeleton;
