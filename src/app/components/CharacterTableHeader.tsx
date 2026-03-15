import React from "react";
import { TableRow, TableCell } from "@mui/material";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CharacterTableHeaderProps {
  columnSort?: string | null;
  columnSortDir?: "asc" | "desc";
  onColumnSort?: (column: string) => void;
}

const baseCellClass = "!bg-gray-800/50 !text-gray-400 font-medium text-xs tracking-wider";
const clickableClass = `${baseCellClass} cursor-pointer select-none hover:!text-gray-200 transition-colors duration-150 group/header`;

const SortIndicator: React.FC<{ column: string; active: string | null | undefined; dir: "asc" | "desc" | undefined }> = ({ column, active, dir }) => {
  const isActive = active === column;
  const Icon = (!isActive || dir === "asc") ? ChevronUp : ChevronDown;
  return (
    <Icon
      size={11}
      className={`inline ml-0.5 transition-opacity duration-150 ${
        isActive ? "opacity-100 text-gray-200" : "opacity-0 group-hover/header:opacity-70 text-gray-400"
      }`}
    />
  );
};

const CharacterTableHeader: React.FC<CharacterTableHeaderProps> = ({
  columnSort = null,
  columnSortDir = "asc",
  onColumnSort,
}) => {
  const handleClick = (col: string) => () => onColumnSort?.(col);
  const cellSx = (width: string, extra?: object) => ({
    width, padding: "4px 6px", borderBottom: "none", height: "24px", ...extra,
  });

  return (
    <TableRow>
      <TableCell
        sx={cellSx("5%", { minWidth: "30px", maxWidth: "50px" })}
        className={baseCellClass}
      />
      <TableCell
        sx={cellSx("20%", { minWidth: "100px" })}
        className={clickableClass}
        onClick={handleClick("name")}
      >
        Name<SortIndicator column="name" active={columnSort} dir={columnSortDir} />
      </TableCell>
      <TableCell
        sx={cellSx("12%", { minWidth: "80px" })}
        className={clickableClass}
        onClick={handleClick("class")}
      >
        Class<SortIndicator column="class" active={columnSort} dir={columnSortDir} />
      </TableCell>
      <TableCell
        sx={cellSx("12%", { minWidth: "80px" })}
        className={clickableClass}
        onClick={handleClick("rank")}
      >
        Realm Rank<SortIndicator column="rank" active={columnSort} dir={columnSortDir} />
      </TableCell>
      <TableCell
        sx={cellSx("18%", { minWidth: "100px" })}
        className={baseCellClass}
      >
        Guild
      </TableCell>
      <TableCell
        sx={cellSx("8%", { minWidth: "60px" })}
        className={clickableClass}
        onClick={handleClick("level")}
      >
        Level<SortIndicator column="level" active={columnSort} dir={columnSortDir} />
      </TableCell>
      <TableCell
        sx={cellSx("10%", { minWidth: "80px" })}
        className={`hidden lg:table-cell ${baseCellClass}`}
      >
        Race
      </TableCell>
      <TableCell
        sx={cellSx("10%", { minWidth: "80px" })}
        className={baseCellClass}
      >
        Realm
      </TableCell>
      <TableCell
        sx={cellSx("10%", { minWidth: "80px" })}
        className={clickableClass}
        onClick={handleClick("server")}
      >
        Server<SortIndicator column="server" active={columnSort} dir={columnSortDir} />
      </TableCell>
      <TableCell
        sx={cellSx("5%", { minWidth: "30px", maxWidth: "50px" })}
        className={baseCellClass}
      />
    </TableRow>
  );
};

export default CharacterTableHeader;
