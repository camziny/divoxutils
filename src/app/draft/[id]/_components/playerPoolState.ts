export type PlayerPoolEmptyState = {
  topNotice: string | null;
  listEmptyLabel: string | null;
};

export function getPlayerPoolEmptyState({
  playersCount,
  isSetup,
  isDrafting,
}: {
  playersCount: number;
  isSetup: boolean;
  isDrafting: boolean;
}): PlayerPoolEmptyState {
  if (playersCount > 0) {
    return { topNotice: null, listEmptyLabel: null };
  }

  if (isSetup) {
    return { topNotice: null, listEmptyLabel: "No players" };
  }

  if (isDrafting) {
    return { topNotice: "No players remaining", listEmptyLabel: null };
  }

  return { topNotice: null, listEmptyLabel: null };
}
