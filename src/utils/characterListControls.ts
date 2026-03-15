import { CLASS_CATEGORIES } from "@/app/draft/constants";
import { CharacterData } from "@/utils/character";

export type ClassFilter = "all" | "tank" | "caster" | "support" | "stealth";
export type ColumnSortDir = "asc" | "desc";

const CLASS_FILTERS: ClassFilter[] = ["all", "tank", "caster", "support", "stealth"];

const CLASS_FILTER_MAP: Record<Exclude<ClassFilter, "all">, Set<string>> = {
  tank: new Set([...CLASS_CATEGORIES.Tank, "Mauler"]),
  caster: new Set([...CLASS_CATEGORIES.Caster, "Mauler"]),
  support: new Set(CLASS_CATEGORIES.Support),
  stealth: new Set(CLASS_CATEGORIES.Stealth),
};

const NUMERIC_COLUMNS = new Set(["level", "rank"]);

export const normalizeClassFilter = (value: string | string[] | undefined): ClassFilter => {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized && CLASS_FILTERS.includes(normalized as ClassFilter)) {
    return normalized as ClassFilter;
  }
  return "all";
};

export const filterCharactersByClass = (
  characters: CharacterData[],
  classFilter: ClassFilter
): CharacterData[] => {
  if (classFilter === "all") return characters;
  const allowed = CLASS_FILTER_MAP[classFilter];
  return characters.filter((c) => allowed.has(c.heraldClassName || ""));
};

export const getEffectiveCharacterSortKey = (
  sortOption: string,
  columnSort: string | null,
  columnSortDir: ColumnSortDir
): string => {
  if (!columnSort) return sortOption;
  if (columnSort === "rank") {
    return columnSortDir === "desc" ? "rank-high-to-low" : "rank-low-to-high";
  }
  return `${columnSort}-${columnSortDir}`;
};

export const getNextColumnSortState = (
  currentColumnSort: string | null,
  currentDir: ColumnSortDir,
  column: string
): { columnSort: string; columnSortDir: ColumnSortDir } => {
  if (currentColumnSort === column) {
    return {
      columnSort: column,
      columnSortDir: currentDir === "asc" ? "desc" : "asc",
    };
  }

  return {
    columnSort: column,
    columnSortDir: NUMERIC_COLUMNS.has(column) ? "desc" : "asc",
  };
};
