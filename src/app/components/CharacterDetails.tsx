import React from "react";
import { TableCell } from "@mui/material";
import RealmRank, {
  getRealmRankForPoints,
  getRealmRanks,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
} from "./RealmRank";
import LinearProgress from "@mui/material/LinearProgress";
import { Progress } from "@nextui-org/react";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
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
        total: KillStats;
        [key: string]: KillStats;
      };
    };
  };
};

type CharacterDetailsProps = {
  character: CharacterInfo;
  opponentRealms: string[];
};

type RealmColorsType = {
  [key: string]: string;
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
};

const realmColors: RealmColorsType = {
  albion: "bg-red-500",
  midgard: "bg-blue-500",
  hibernia: "bg-green-500",
  total: "bg-gray-600",
};

const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  character,
  opponentRealms,
}) => {
  const firstOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[0]];
  const secondOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[1]];

  const realmColors = {
    albion: "albion",
    midgard: "midgard",
    hibernia: "hibernia",
    total: "bg-gray-600",
  };

  const realmPoints = character.realm_war_stats?.current?.realm_points;
  const deaths =
    character.realm_war_stats?.current?.player_kills?.total?.deaths;
  const irs =
    !deaths || deaths === 0
      ? undefined
      : realmPoints && deaths
      ? parseFloat((realmPoints / deaths).toFixed(2))
      : undefined;
  const currentRank = getRealmRankForPoints(realmPoints);
  const nextRankPoints = getRealmRanks().get(currentRank + 1) || 0;
  const pointsUntilNextRank = nextRankPoints - realmPoints;
  const totalKills =
    character.realm_war_stats?.current?.player_kills?.total?.kills || 0;
  const currentRankNumber = getRealmRankForPoints(
    character.realm_war_stats?.current?.realm_points
  );
  const nextRankFormatted = formatRealmRankWithLevel(currentRankNumber + 1);
  const currentRankFormatted = formatRealmRankWithLevel(currentRank);
  const capitalizeRealm = (realm: string) => {
    return realm.charAt(0).toUpperCase() + realm.slice(1);
  };

  function formatNumber(num: any) {
    if (typeof num === "number" && !isNaN(num)) {
      return num.toLocaleString();
    } else if (num === undefined || num === null) {
      return "0";
    } else {
      return "N/A";
    }
  }

  const progressPercentage = calculateProgressPercentage(
    realmPoints,
    nextRankPoints
  );

  return (
    <TableCell className="bg-gray-900 w-full p-3" colSpan={9}>
      <div className="flex justify-center items-center h-full">
        <div className="sm:hidden">
          <div className="bg-gray-900 p-4 rounded-lg mx-2">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-white">{character.name}</h2>
              <p className="text-sm text-gray-300">
                {character.guild_info?.guild_name &&
                  `<${character.guild_info.guild_name}>`}
              </p>
              <p className="text-sm text-gray-300">
                {`${character.race} ${character.class_name}, Lvl ${character.level}`}
              </p>
            </div>
            <div className="mb-6">
              <h3 className="rounded-lg mb-2 px-2 py-1 uppercase text-xs font-bold text-center bg-gray-700 text-white">
                Info
              </h3>
              <div className="flex flex-col items-center space-y-3 px-2 text-xs sm:text-sm text-gray-300">
                <div className="w-full text-center">
                  <span>Total RP: {formatNumber(realmPoints)}</span>
                </div>
                <div className="w-full text-center">
                  <span className="font-medium">IRS:</span>
                  <span className="ml-1">
                    {irs !== undefined ? formatNumber(Math.round(irs)) : "N/A"}
                  </span>
                </div>
                <div className="w-full text-center">
                  <span className="font-medium">
                    RPs to{" "}
                    <span className="font-extrabold">{nextRankFormatted}</span>:
                  </span>
                  <span className="ml-1">
                    {formatNumber(pointsUntilNextRank)}
                  </span>
                </div>
                <div className="flex flex-col items-center w-full">
                  <Progress
                    size="md"
                    radius="sm"
                    classNames={{
                      base: "max-w-md",
                      track: "drop-shadow-md border border-default bg-gray-200",
                      indicator: "customIndicator",
                      label: "tracking-wider font-bold text-gray-400",
                      value: "text-base font-bold text-indigo-400",
                    }}
                    label={nextRankFormatted}
                    value={progressPercentage}
                    showValueLabel={true}
                  />
                </div>
              </div>
            </div>

            {[...opponentRealms].map((realm) => (
              <div key={realm} className="mb-4">
                <h3
                  className={`rounded-lg mb-2 px-2 py-1 uppercase text-xs font-bold text-center ${
                    realmColors[realm.toLowerCase() as keyof typeof realmColors]
                  } text-white`}
                >
                  {capitalizeRealm(realm)}
                </h3>
                <div className="flex flex-col items-center space-y-2 px-2 text-xs text-gray-300">
                  <div className="w-full text-center">
                    Kills:{" "}
                    {formatNumber(
                      character.realm_war_stats?.current?.player_kills[realm]
                        ?.kills || 0
                    )}
                  </div>
                  <div className="w-full text-center">
                    Death Blows:{" "}
                    {formatNumber(
                      character.realm_war_stats?.current?.player_kills[realm]
                        ?.death_blows || 0
                    )}
                  </div>
                  <div className="w-full text-center">
                    Solo Kills:{" "}
                    {formatNumber(
                      character.realm_war_stats?.current?.player_kills[realm]
                        ?.solo_kills || 0
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="mb-4">
              <h3 className="rounded-lg mb-2 px-2 py-1 uppercase text-xs font-bold text-center bg-gray-700 text-white">
                Total
              </h3>
              <div className="flex flex-col items-center space-y-2 px-2 text-xs text-gray-300">
                <div className="w-full text-center">
                  Kills:{" "}
                  {formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.kills || 0
                  )}
                </div>
                <div className="w-full text-center">
                  Death Blows:{" "}
                  {formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.death_blows || 0
                  )}
                </div>
                <div className="w-full text-center">
                  Solo Kills:{" "}
                  {formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.solo_kills || 0
                  )}
                </div>
                <div className="w-full text-center">
                  Deaths:{" "}
                  {formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.deaths || 0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:w-full sm:max-w-4xl sm:mx-auto">
          {[...opponentRealms, "Total", "Info"].map((realm, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300 text-white space-y-2"
            >
              <span
                className={`inline-block py-0.5 px-2.5 rounded-full ${
                  realm !== "Total" && realm !== "Info"
                    ? realmColors[
                        realm.toLowerCase() as keyof typeof realmColors
                      ]
                    : "bg-gray-500"
                } uppercase text-xs font-medium`}
              >
                {realm === "Total" || realm === "Info"
                  ? realm
                  : capitalizeRealm(realm)}
              </span>
              <div className="space-y-1 mt-1">
                {realm !== "Info" && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Kills:</span>
                      <span className="w-24 text-right">
                        {formatNumber(
                          realm === "Total"
                            ? character.realm_war_stats?.current?.player_kills
                                ?.total?.kills
                            : character.realm_war_stats?.current?.player_kills[
                                realm
                              ]?.kills
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Death blows:</span>
                      <span className="w-24 text-right">
                        {formatNumber(
                          realm === "Total"
                            ? character.realm_war_stats?.current?.player_kills
                                ?.total?.death_blows
                            : character.realm_war_stats?.current?.player_kills[
                                realm
                              ]?.death_blows
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Solo kills:</span>
                      <span className="w-24 text-right">
                        {formatNumber(
                          realm === "Total"
                            ? character.realm_war_stats?.current?.player_kills
                                ?.total?.solo_kills
                            : character.realm_war_stats?.current?.player_kills[
                                realm
                              ]?.solo_kills
                        )}
                      </span>
                    </div>
                    {realm === "Total" && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Deaths:</span>
                        <span className="w-24 text-right">
                          {formatNumber(
                            character.realm_war_stats?.current?.player_kills
                              ?.total?.deaths || 0
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {realm === "Info" && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Total RP:</span>
                      <span className="w-28 text-right">
                        {formatNumber(realmPoints)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">IRS:</span>
                      <span className="w-28 text-right">
                        {irs !== undefined
                          ? formatNumber(Math.round(irs))
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">
                        RPs to{" "}
                        <span className="font-extrabold">
                          {nextRankFormatted}
                        </span>
                        :
                      </span>
                      <span className="w-28 text-right">
                        {formatNumber(pointsUntilNextRank)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center w-full">
                      <Progress
                        size="md"
                        radius="sm"
                        classNames={{
                          base: "max-w-md",
                          track:
                            "drop-shadow-md border border-default bg-gray-300",
                          indicator: "customIndicator",
                          label: "tracking-wider font-bold text-gray-400",
                          value: "text-base font-bold text-indigo-400",
                        }}
                        label={nextRankFormatted}
                        value={progressPercentage}
                        showValueLabel={true}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TableCell>
  );
};

export default CharacterDetails;
