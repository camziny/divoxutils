export const getRealmNameAndColor = (realmId: number) => {
  switch (realmId) {
    case 1:
      return { name: "Albion", color: "albion" };
    case 2:
      return { name: "Midgard", color: "midgard" };
    case 3:
      return { name: "Hibernia", color: "hibernia" };
    default:
      return { name: "", color: "" };
  }
};

export function getRealmRanks(): Map<number, number> {
  const realmRanks = new Map<number, number>();

  for (let rr = 0; rr < 100; rr++) {
    realmRanks.set(
      rr + 11,
      (50 * Math.pow(rr, 3) + 75 * Math.pow(rr, 2) + 25 * rr) / 6
    );
  }

  const hardcodedRanks: [number, number][] = [
    [111, 9111713],
    [112, 10114001],
    [113, 11226541],
    [114, 12461460],
    [115, 13832221],
    [116, 15353765],
    [117, 17042680],
    [118, 18917374],
    [119, 20998286],
    [120, 23308097],
    [121, 25871988],
    [122, 28717906],
    [123, 31876876],
    [124, 35383333],
    [125, 39275499],
    [126, 43595804],
    [127, 48391343],
    [128, 53714390],
    [129, 59622973],
    [130, 66181501],
    [131, 73461466],
    [132, 81542227],
    [133, 90511872],
    [134, 100468178],
    [135, 111519678],
    [136, 123786843],
    [137, 137403395],
    [138, 152517769],
    [139, 169294723],
    [140, 187917143],
  ];

  for (const [rank, points] of hardcodedRanks) {
    realmRanks.set(rank, points);
  }

  return realmRanks;
}
export const realmRanksMap: any = getRealmRanks();

export function getRealmRankForPoints(points: number): number {
  let rank = 0;

  for (const [rr, requiredPoints] of realmRanksMap) {
    if (points >= requiredPoints) {
      rank = rr;
    } else {
      break;
    }
  }

  return rank;
}

export function formatRealmRankWithLevel(rank: number): string {
  const rankString = rank.toString();
  return `${rankString.slice(0, -1)}L${rankString.slice(-1)}`;
}

export function calculateProgressPercentage(
  realmPoints: number,
  nextRankPoints: number
): number {
  const currentRank = getRealmRankForPoints(realmPoints);
  const pointsForCurrentRank = realmRanksMap.get(currentRank) || 0;
  const totalPointsForNextRank = nextRankPoints - pointsForCurrentRank;
  const pointsEarnedForNextRank = realmPoints - pointsForCurrentRank;
  const progressPercentage =
    (pointsEarnedForNextRank / totalPointsForNextRank) * 100;

  return Math.min(Math.max(progressPercentage, 0), 100);
}

export const realmsSummary = {
  Albion: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
  Midgard: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
  Hibernia: {
    kills: 0,
    deathblows: 0,
    soloKills: 0,
    deaths: 0,
    realmPoints: 0,
  },
  Total: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
};

export type KillStats = {
  total: number;
  [key: string]: number;
};

export type CharacterInfo = {
  character_web_id: string;
  name: string;
  realm: number;
  race: string;
  class_name: string;
  level: number;
  nextRankPoints?: number;
  guild_info?: {
    guild_name?: string;
  };
  realm_war_stats: {
    current: {
      realm_points: number;
      player_kills: {
        total: number;
        [key: number]: KillStats;
      };
    };
  };
};
