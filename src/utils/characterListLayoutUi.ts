import type { DesktopLayout } from "@/utils/characterListLayout";

export const getDesktopLayoutLabel = (layout: DesktopLayout): string =>
  layout === "realm-grid" ? "Compact" : "Classic";

export const shouldShowSaveLayoutHint = ({
  isSignedIn,
  desktopLayout,
  savedPreference,
}: {
  isSignedIn: boolean;
  desktopLayout: DesktopLayout;
  savedPreference: DesktopLayout;
}): boolean => isSignedIn && desktopLayout !== savedPreference;

export const shouldApplyRealmGridRankSort = ({
  isDesktopViewport,
  desktopLayout,
  sortOption,
  columnSort,
}: {
  isDesktopViewport: boolean;
  desktopLayout: DesktopLayout;
  sortOption: string;
  columnSort: string | null;
}): boolean =>
  isDesktopViewport &&
  desktopLayout === "realm-grid" &&
  sortOption === "realm" &&
  !columnSort;
