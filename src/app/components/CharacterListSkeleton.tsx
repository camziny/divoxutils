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
      <div className="w-full mb-4">
        <div className="animate-pulse bg-gray-700 rounded-lg h-12 w-48"></div>
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
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Array.from({ length: 9 }).map((_, index) => (
                  <TableCell key={index}>
                    <div className="animate-pulse bg-gray-700 rounded h-6 w-20"></div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 9 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="animate-pulse bg-gray-700 rounded h-10 w-full"></div>
                    </TableCell>
                  ))}
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
              className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 mb-3 p-4"
            >
              <div className="animate-pulse space-y-3">
                <div className="bg-gray-700 rounded h-6 w-3/4"></div>
                <div className="bg-gray-700 rounded h-4 w-1/2"></div>
                <div className="flex justify-between">
                  <div className="bg-gray-700 rounded h-4 w-1/4"></div>
                  <div className="bg-gray-700 rounded h-4 w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full max-w-md">
        <div className="animate-pulse bg-gray-700 rounded-lg h-20 w-full"></div>
      </div>
    </div>
  );
};

export default CharacterListSkeleton; 