import { TableCell, TableRow } from "@mui/material";

function CharacterTableHeader() {
  return (
    <TableRow>
      <TableCell className="w-12 px-4 sticky top-0 z-10 bg-gray-900" />
      <TableCell className="w-32 px-4 sticky top-0 z-10 bg-gray-900">
        Name
      </TableCell>
      <TableCell className="w-32 sm:w-auto sm:px-6 sticky top-0 z-10 bg-gray-900">
        Guild
      </TableCell>
      <TableCell className="w-20 sm:w-auto sm:px-6 sticky top-0 z-10 bg-gray-900">
        Realm
      </TableCell>
      <TableCell className="w-16 sm:w-auto sm:px-6 sticky top-0 z-10 bg-gray-900">
        Level
      </TableCell>
      <TableCell className="w-24 lg:w-auto lg:px-8 sticky top-0 z-10 bg-gray-900">
        Race
      </TableCell>
      <TableCell className="w-24 lg:w-auto lg:px-8 sticky top-0 z-10 bg-gray-900">
        Class
      </TableCell>
      <TableCell className="w-24 px-4 sticky top-0 z-10 bg-gray-900">
        Realm Rank
      </TableCell>
      <TableCell className="w-12 px-4 sticky top-0 z-10 bg-gray-900" />
    </TableRow>
  );
}

export default CharacterTableHeader;
