import React from "react";
import { TableRow, TableCell } from "@mui/material";

const CharacterTableHeader = () => {
  return (
    <TableRow>
      <TableCell
        sx={{ 
          width: "5%", 
          padding: "4px 6px",
          minWidth: "30px", 
          maxWidth: "50px",
          borderBottom: "none",
          height: "24px"
        }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs uppercase tracking-wider"
      />
      <TableCell
        sx={{ 
          width: "20%", 
          padding: "4px 6px", 
          minWidth: "100px",
          borderBottom: "none",
          height: "24px"
        }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Name
      </TableCell>
      <TableCell
        sx={{ width: "12%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Class
      </TableCell>
      <TableCell
        sx={{ width: "12%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Realm Rank
      </TableCell>
      <TableCell
        sx={{ width: "18%", padding: "4px 6px", minWidth: "100px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Guild
      </TableCell>
      <TableCell
        sx={{ width: "8%", padding: "4px 6px", minWidth: "60px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Level
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
        className="hidden lg:table-cell !bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Race
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Realm
      </TableCell>
      <TableCell
        sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      >
        Server
      </TableCell>
      <TableCell
        sx={{ width: "5%", padding: "4px 6px", minWidth: "30px", maxWidth: "50px", borderBottom: "none", height: "24px" }}
        className="!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider"
      />
    </TableRow>
  );
};

export default CharacterTableHeader;
