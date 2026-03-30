export type DesktopLayout = "table" | "realm-grid";

const DESKTOP_LAYOUTS: DesktopLayout[] = ["table", "realm-grid"];

export const resolveInitialDesktopLayout = ({
  searchParams,
  preferredDesktopLayout,
}: {
  searchParams?: { [key: string]: string | string[] };
  preferredDesktopLayout?: DesktopLayout | null;
}): DesktopLayout => {
  const rawSearchParam = searchParams?.layout;
  const queryLayout = Array.isArray(rawSearchParam)
    ? rawSearchParam[0]
    : rawSearchParam;

  if (queryLayout && DESKTOP_LAYOUTS.includes(queryLayout as DesktopLayout)) {
    return queryLayout as DesktopLayout;
  }

  if (
    preferredDesktopLayout &&
    DESKTOP_LAYOUTS.includes(preferredDesktopLayout)
  ) {
    return preferredDesktopLayout;
  }

  return "table";
};
