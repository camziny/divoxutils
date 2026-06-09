import { CLASS_CATEGORIES } from "@/app/draft/_lib/constants";
import { CharacterData } from "@/utils/character";

export type ClassFilter = "all" | "tank" | "caster" | "support" | "stealth";
export type ColumnSortDir = "asc" | "desc";

export type CharacterListSearchParamsInput = {
  [key: string]: string | string[] | undefined;
};

export type ParsedCharacterListSearchParams = {
  sortOption: string;
  columnSort: string | null;
  columnSortDir: ColumnSortDir;
  classFilter: ClassFilter;
  statSort: string | null;
  statSortDir: ColumnSortDir;
  showFilters: boolean;
  showStatSorts: boolean;
};

const CLASS_FILTERS: ClassFilter[] = ["all", "tank", "caster", "support", "stealth"];
const PRIMARY_SORT_OPTIONS = new Set([
  "realm",
  "rank-high-to-low",
  "rank-low-to-high",
]);

export const normalizeSearchParam = (
  value: string | string[] | undefined | null
): string | undefined => {
  if (value == null) return undefined;
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized || undefined;
};

const CLASS_NAME_ALIASES: Record<string, string> = {
  armswoman: "armsman",
  heroine: "hero",
  sorceress: "sorcerer",
  enchantress: "enchanter",
  huntress: "hunter",
};

const normalizeClassName = (className: string | undefined): string => {
  const normalized = (className ?? "").trim().toLowerCase();
  return CLASS_NAME_ALIASES[normalized] ?? normalized;
};

const CLASS_FILTER_MAP: Record<Exclude<ClassFilter, "all">, Set<string>> = {
  tank: new Set(
    [...CLASS_CATEGORIES.Tank, "Mauler", "Necromancer"].map((className) =>
      normalizeClassName(className)
    )
  ),
  caster: new Set(
    [...CLASS_CATEGORIES.Caster, "Mauler", "Thane"].map((className) =>
      normalizeClassName(className)
    )
  ),
  support: new Set(CLASS_CATEGORIES.Support.map((className) => normalizeClassName(className))),
  stealth: new Set(CLASS_CATEGORIES.Stealth.map((className) => normalizeClassName(className))),
};

const NUMERIC_COLUMNS = new Set([
  "level",
  "rank",
  "kills",
  "deaths",
  "deathblows",
  "solokills",
]);

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
  return characters.filter((c) => allowed.has(normalizeClassName(c.heraldClassName)));
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

export type StatSortOption = {
  key: string;
  label: string;
};

export const STAT_SORT_OPTIONS: StatSortOption[] = [
  { key: "kills", label: "Kills" },
  { key: "deathblows", label: "Deathblows" },
  { key: "solokills", label: "Solo Kills" },
  { key: "deaths", label: "Deaths" },
];

const STAT_SORT_KEYS = new Set(STAT_SORT_OPTIONS.map((o) => o.key));

export const isStatSort = (sortOption: string): boolean =>
  STAT_SORT_KEYS.has(sortOption);

export const getStatSortLabel = (sortOption: string): string | null =>
  STAT_SORT_OPTIONS.find((o) => o.key === sortOption)?.label ?? null;

export const parseCharacterListSearchParams = (
  searchParams: CharacterListSearchParamsInput
): ParsedCharacterListSearchParams => {
  const statSortRaw = normalizeSearchParam(searchParams.statSort);
  const statSort = statSortRaw && isStatSort(statSortRaw) ? statSortRaw : null;
  const statSortDir =
    normalizeSearchParam(searchParams.statSortDir) === "asc" ? "asc" : "desc";

  const sortOptionRaw = normalizeSearchParam(searchParams.sortOption);
  const sortOption =
    sortOptionRaw && PRIMARY_SORT_OPTIONS.has(sortOptionRaw)
      ? sortOptionRaw
      : "realm";

  const columnSort = normalizeSearchParam(searchParams.columnSort) ?? null;
  const columnSortDir =
    normalizeSearchParam(searchParams.columnSortDir) === "desc" ? "desc" : "asc";
  const classFilter = normalizeClassFilter(searchParams.classFilter);

  return {
    sortOption,
    columnSort,
    columnSortDir,
    classFilter,
    statSort,
    statSortDir,
    showFilters: classFilter !== "all",
    showStatSorts: statSort !== null,
  };
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
