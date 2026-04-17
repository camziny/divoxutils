export const PIE_COLORS = ["#818cf8", "#374151"];

export type ClassSortKey = "games" | "winRate" | "wins" | "losses";
export type ClassView = "table" | "map";
export type HeadToHeadView = "all" | "captain";
export type TeammateView = "winning" | "losing";

export const DEFAULT_CLASS_SORT: ClassSortKey = "winRate";
export const DEFAULT_CLASS_VIEW: ClassView = "table";
export const DEFAULT_HEAD_TO_HEAD_VIEW: HeadToHeadView = "all";
export const DEFAULT_TEAMMATE_VIEW: TeammateView = "winning";

export function formatWinRate(rate: number): string {
  return rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(1);
}

export function getBreakdownBarClass(label: string): string {
  const normalized = label.trim().toLowerCase();
  if (normalized === "pvp") return "bg-indigo-400/60";
  if (normalized === "albion" || normalized === "alb") return "bg-red-400/60";
  if (normalized === "midgard" || normalized === "mid") return "bg-blue-400/60";
  if (normalized === "hibernia" || normalized === "hib") return "bg-green-400/60";
  return "bg-gray-400/60";
}

export function parseClassSort(value: string | null): ClassSortKey {
  if (value === "games" || value === "winRate" || value === "wins" || value === "losses") {
    return value;
  }
  return DEFAULT_CLASS_SORT;
}

export function parseClassView(value: string | null): ClassView {
  if (value === "table" || value === "map") return value;
  return DEFAULT_CLASS_VIEW;
}

export function parseHeadToHeadView(value: string | null): HeadToHeadView {
  if (value === "all" || value === "captain") return value;
  return DEFAULT_HEAD_TO_HEAD_VIEW;
}

export function parseTeammateView(value: string | null): TeammateView {
  if (value === "winning" || value === "losing") return value;
  return DEFAULT_TEAMMATE_VIEW;
}
