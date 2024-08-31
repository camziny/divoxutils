import { TableCell, TableRow } from "@mui/material";

function CharacterTableHeader() {
  return (
    <TableRow>
      <TableCell className="w-1/12 px-4 sticky top-0 z-10 bg-gray-900" />
      <TableCell className="w-1/4 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Name
      </TableCell>
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Class
      </TableCell>
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Realm Rank
      </TableCell>
      <TableCell className="w-1/4 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Guild
      </TableCell>
      <TableCell className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white">
        Level
      </TableCell>
      <TableCell
        className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white hidden lg:table-cell"
        sx={{ paddingLeft: "5px" }}
      >
        Race
      </TableCell>
      <TableCell
        className="w-1/6 px-6 sticky top-0 z-10 bg-gray-900 text-white"
        sx={{ paddingLeft: "5px" }}
      >
        Realm
      </TableCell>
      <TableCell className="w-1/12 px-4 sticky top-0 z-10 bg-gray-900" />
    </TableRow>
  );
}

export default CharacterTableHeader;
