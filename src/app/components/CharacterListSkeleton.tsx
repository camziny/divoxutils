import React from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@mui/material";

const CharacterListSkeleton = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-6xl">
      <div className="w-full mb-6 flex justify-center">
        <div className="flex gap-3">
          <div className="animate-pulse bg-gray-600/40 rounded-lg h-10 w-24"></div>
          <div className="animate-pulse bg-gray-600/40 rounded-lg h-10 w-20"></div>
          <div className="animate-pulse bg-gray-600/40 rounded-lg h-10 w-16"></div>
          <div className="animate-pulse bg-gray-600/40 rounded-lg h-10 w-20"></div>
        </div>
      </div>

      <div className="hidden sm:block w-full">
        <TableContainer
          component={Paper}
          className="max-h-[60vh] lg:max-h-[70vh] xl:max-h-[75vh]"
          sx={{
            background:
              "linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)",
            backdropFilter: "blur(8px)",
            boxShadow: "none",
            borderRadius: "16px",
            "& .MuiTable-root": {
              borderCollapse: "separate",
              borderSpacing: "0 1px",
            },
          }}
        >
          <Table stickyHeader style={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ width: "5%", padding: "4px 6px", minWidth: "30px", maxWidth: "50px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                />
                <TableCell
                  sx={{ width: "20%", padding: "4px 6px", minWidth: "100px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-8"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "12%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-10"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "12%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-16"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "18%", padding: "4px 6px", minWidth: "100px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-10"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "8%", padding: "4px 6px", minWidth: "60px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-8"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
                  className="hidden lg:table-cell !bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-8"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-10"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "10%", padding: "4px 6px", minWidth: "80px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                >
                  <div className="animate-pulse bg-gray-600/40 rounded h-3 w-12"></div>
                </TableCell>
                <TableCell
                  sx={{ width: "5%", padding: "4px 6px", minWidth: "30px", maxWidth: "50px", borderBottom: "none", height: "24px" }}
                  className="!bg-gray-800/50"
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded-full h-4 w-4"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-20"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-16"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-12"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-24"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-8"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }} className="hidden lg:table-cell">
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-12"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-10"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-16"></div>
                  </TableCell>
                  <TableCell sx={{ padding: "4px 6px" }}>
                    <div className="animate-pulse bg-gray-600/40 rounded h-4 w-4"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="sm:hidden w-full">
        <div className="max-h-[60vh] overflow-y-auto rounded-lg">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/30 mb-3 p-4"
            >
              <div className="animate-pulse space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-600/40 rounded-full h-5 w-5"></div>
                  <div className="bg-gray-600/40 rounded h-4 w-28"></div>
                </div>
                <div className="bg-gray-600/40 rounded h-3 w-20"></div>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-600/40 rounded h-3 w-16"></div>
                  <div className="bg-gray-600/40 rounded h-3 w-12"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-600/40 rounded h-3 w-20"></div>
                  <div className="bg-gray-600/40 rounded h-3 w-14"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-600/40 rounded h-4 w-32 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="bg-gray-600/40 rounded h-5 w-12 mx-auto"></div>
                <div className="bg-gray-600/40 rounded h-3 w-16 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-600/40 rounded h-5 w-12 mx-auto"></div>
                <div className="bg-gray-600/40 rounded h-3 w-16 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-600/40 rounded h-5 w-12 mx-auto"></div>
                <div className="bg-gray-600/40 rounded h-3 w-16 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-600/40 rounded h-5 w-12 mx-auto"></div>
                <div className="bg-gray-600/40 rounded h-3 w-16 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterListSkeleton; 