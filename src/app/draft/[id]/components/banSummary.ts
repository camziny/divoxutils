import { DraftBan } from "../../types";

export type BanSummaryGroup = {
  key: "team1" | "team2" | "auto";
  label: string;
  classNames: string[];
};

export function splitBansForLiveSummary(bans: DraftBan[]) {
  const team1 = bans.filter((ban) => ban.team === 1 && ban.source !== "auto");
  const team2 = bans.filter((ban) => ban.team === 2 && ban.source !== "auto");
  const auto = bans.filter((ban) => ban.source === "auto");

  return { team1, team2, auto };
}

export function buildLiveBanSummaryGroups(bans: DraftBan[]): BanSummaryGroup[] {
  const { team1, team2, auto } = splitBansForLiveSummary(bans);
  return [
    { key: "team1", label: "T1", classNames: team1.map((ban) => ban.className) },
    { key: "team2", label: "T2", classNames: team2.map((ban) => ban.className) },
    { key: "auto", label: "Auto", classNames: auto.map((ban) => ban.className) },
  ];
}
