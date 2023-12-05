import { TableCell, TableRow } from "@mui/material";

function CharacterTableHeader() {
  return (
    <TableRow>
      {/* Placeholder for Expand/Collapse Icon */}
      <TableCell className="w-1/12 px-4 sticky top-0 z-10 bg-gray-900" />

      {/* Name */}
      <TableCell className="w-1/4 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Name
      </TableCell>

      {/* Class */}
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Class
      </TableCell>

      {/* Realm Rank */}
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Realm Rank
      </TableCell>

      {/* Guild */}
      <TableCell className="w-1/4 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Guild
      </TableCell>

      {/* Level */}
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Level
      </TableCell>

      {/* Race */}
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white hidden lg:table-cell">
        Race
      </TableCell>

      {/* Realm */}
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Realm
      </TableCell>

      {/* Placeholder for Delete Icon */}
      <TableCell className="w-1/12 px-4 sticky top-0 z-10 bg-gray-900" />
    </TableRow>
  );
}

export default CharacterTableHeader;
