import { TableCell, TableRow } from "@mui/material";

function CharacterTableHeader() {
  return (
    <TableRow>
      <TableCell className="header-text-color w-12 px-4" />{" "}
      {/* Padding aligned with the container */}
      <TableCell className="header-text-color w-32 px-4">Name</TableCell>{" "}
      {/* Consistent padding */}
      <TableCell className="header-text-color w-32 sm:w-auto sm:px-6">
        Guild
      </TableCell>{" "}
      {/* Responsive width and padding */}
      <TableCell className="header-text-color w-20 sm:w-auto sm:px-6">
        Realm
      </TableCell>{" "}
      {/* Responsive width and padding */}
      <TableCell className="header-text-color w-16 sm:w-auto sm:px-6">
        Level
      </TableCell>{" "}
      {/* Responsive width and padding */}
      <TableCell className="header-text-color w-24 lg:w-auto lg:px-8">
        Race
      </TableCell>{" "}
      {/* Responsive width and padding */}
      <TableCell className="header-text-color w-24 lg:w-auto lg:px-8">
        Class
      </TableCell>{" "}
      {/* Responsive width and padding */}
      <TableCell className="header-text-color w-24 px-4">
        Realm Rank
      </TableCell>{" "}
      {/* Consistent padding */}
      <TableCell className="header-text-color w-12 px-4" />{" "}
      {/* Padding aligned with the container */}
    </TableRow>
  );
}

export default CharacterTableHeader;
