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
          <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-32"></div>
          <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-28"></div>
          <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-24"></div>
          <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-20"></div>
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
                <TableCell className="w-12">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-4"></div>
                </TableCell>
                <TableCell className="w-1/4">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-20"></div>
                </TableCell>
                <TableCell className="w-1/6">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-16"></div>
                </TableCell>
                <TableCell className="w-1/6">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-14"></div>
                </TableCell>
                <TableCell className="w-1/4">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-18"></div>
                </TableCell>
                <TableCell className="w-1/6">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-12"></div>
                </TableCell>
                <TableCell className="w-1/6 hidden lg:table-cell">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-16"></div>
                </TableCell>
                <TableCell className="w-1/6">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-14"></div>
                </TableCell>
                <TableCell className="w-12">
                  <div className="animate-pulse bg-gray-700 rounded h-4 w-4"></div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="bg-gray-800/50">
                  <TableCell className="w-12">
                    <div className="animate-pulse bg-gray-700 rounded h-6 w-6"></div>
                  </TableCell>
                  <TableCell className="w-1/4">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/6">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/6">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/4">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/6">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/6 hidden lg:table-cell">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-1/6">
                    <div className="animate-pulse bg-gray-700 rounded h-8 w-full"></div>
                  </TableCell>
                  <TableCell className="w-12">
                    <div className="animate-pulse bg-gray-700 rounded h-6 w-6"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="sm:hidden w-full">
        <div className="max-h-[60vh] overflow-y-auto rounded-lg">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 mb-3 p-4"
            >
              <div className="animate-pulse space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-700 rounded-full h-6 w-6"></div>
                  <div className="bg-gray-700 rounded h-5 w-32"></div>
                </div>
                <div className="bg-gray-700 rounded h-4 w-24"></div>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-700 rounded h-4 w-20"></div>
                  <div className="bg-gray-700 rounded h-4 w-16"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-700 rounded h-4 w-18"></div>
                  <div className="bg-gray-700 rounded h-4 w-14"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 w-full">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-700 rounded h-5 w-40 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="bg-gray-700 rounded h-6 w-16 mx-auto"></div>
                <div className="bg-gray-700 rounded h-4 w-20 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-700 rounded h-6 w-16 mx-auto"></div>
                <div className="bg-gray-700 rounded h-4 w-20 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-700 rounded h-6 w-16 mx-auto"></div>
                <div className="bg-gray-700 rounded h-4 w-20 mx-auto"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-gray-700 rounded h-6 w-16 mx-auto"></div>
                <div className="bg-gray-700 rounded h-4 w-20 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterListSkeleton; 