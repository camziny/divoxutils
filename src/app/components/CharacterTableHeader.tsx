import React from "react";
import { TableRow, TableCell } from "@mui/material";

const CharacterTableHeader = () => {
  return (
    <TableRow>
      <TableCell
        sx={{ width: "5%", padding: "6px", minWidth: "30px", maxWidth: "50px" }}
        className="!bg-gray-900 !text-white"
      />
      <TableCell
        sx={{ width: "20%", padding: "6px", minWidth: "100px" }}
        className="!bg-gray-900 !text-white"
      >
        Name
      </TableCell>
      <TableCell
        sx={{ width: "12%", padding: "6px", minWidth: "80px" }}
        className="!bg-gray-900 !text-white"
      >
        Class
      </TableCell>
      <TableCell
        sx={{ width: "12%", padding: "6px", minWidth: "80px" }}
        className="!bg-gray-900 !text-white"
      >
        Realm Rank
      </TableCell>
      <TableCell
        sx={{ width: "18%", padding: "6px", minWidth: "100px" }}
        className="!bg-gray-900 !text-white"
      >
        Guild
      </TableCell>
      <TableCell
        sx={{ width: "8%", padding: "6px", minWidth: "60px" }}
        className="!bg-gray-900 !text-white"
      >
        Level
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "6px", minWidth: "80px" }}
        className="hidden lg:table-cell !bg-gray-900 !text-white"
      >
        Race
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "6px", minWidth: "80px" }}
        className="!bg-gray-900 !text-white"
      >
        Realm
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "6px", minWidth: "80px" }}
        className="!bg-gray-900 !text-white"
      >
        Server
      </TableCell>
      <TableCell
        sx={{ width: "5%", padding: "6px", minWidth: "30px", maxWidth: "50px" }}
        className="!bg-gray-900 !text-white"
      />
    </TableRow>
  );
};

export default CharacterTableHeader;
