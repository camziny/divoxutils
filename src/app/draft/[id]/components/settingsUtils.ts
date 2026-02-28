export function getMaxSelectableTeamSize(playersCount: number): number {
  return Math.min(8, Math.floor(playersCount / 2));
}

export function isTeamSizeSelectable(teamSize: number, playersCount: number): boolean {
  return teamSize <= getMaxSelectableTeamSize(playersCount);
}

export function toUserSettingsError(error: unknown): string {
  const fallback = "Unable to update draft settings.";
  if (!(error instanceof Error)) return fallback;
  const msg = error.message.trim();
  if (!msg) return fallback;
  const needAtLeastMatch = msg.match(/Need at least \d+ players for \d+v\d+/i);
  if (needAtLeastMatch?.[0]) {
    return `${needAtLeastMatch[0]}. Reduce team size or add players.`;
  }
  return msg;
}
