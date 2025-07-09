"use client";
import React, { useState, useEffect, useMemo } from "react";
import { HoverPrefetchLink } from "./HoverPrefetchLink";
import { ViewportPrefetchLink } from "./ViewportPrefetchLink";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Pagination,
  ButtonGroup,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface LeaderboardItem {
  userId: number;
  userName: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  soloKillsThisWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  deathsThisWeek: number;
  totalDeathBlows: number;
  deathBlowsLastWeek: number;
  deathBlowsThisWeek: number;
  irs: number;
  irsLastWeek: number;
  irsThisWeek: number;
  lastUpdated: Date;
  totalIrs?: number;
  [key: string]: number | string | Date | undefined;
}

interface LeaderboardListProps {
  data: LeaderboardItem[];
}

const metrics = {
  realmPoints: "Realm Points",
  soloKills: "Solo Kills",
  deaths: "Deaths",
  deathBlows: "Death Blows",
  irs: "IRS",
};

const periods = {
  total: "",
  lastWeek: "Last Week",
  thisWeek: "This Week",
};

type Metric = keyof typeof metrics;
type Period = keyof typeof periods;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sortLeaderboardData(
  leaderboardData: LeaderboardItem[],
  selectedMetric: Metric,
  selectedPeriod: Period
) {
  const metricKey =
    selectedPeriod === "total"
      ? `total${capitalize(selectedMetric)}`
      : `${selectedMetric}${capitalize(selectedPeriod)}`;

  return [...leaderboardData].sort(
    (a, b) => (b[metricKey] as number) - (a[metricKey] as number)
  );
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("realmPoints");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("total");

  const processedData = useMemo(() => {
    return data.map((item) => {
      const totalIrs =
        item.totalDeaths > 0
          ? Math.round(item.totalRealmPoints / item.totalDeaths)
          : item.totalRealmPoints;
      return { ...item, totalIrs };
    });
  }, [data]);

  const sortedLeaderboardData = useMemo(() => {
    return sortLeaderboardData(processedData, selectedMetric, selectedPeriod);
  }, [processedData, selectedMetric, selectedPeriod]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLeaderboardData.slice(startIndex, endIndex);
  }, [sortedLeaderboardData, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMetricChange = (metric: Metric, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMetric(metric);
  };

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  const formatNumber = (number: number | undefined) => {
    return number === undefined || isNaN(number)
      ? "N/A"
      : new Intl.NumberFormat("en-US").format(number);
  };

  const showDeathBlowsMessage = selectedMetric === "deathBlows" && selectedPeriod !== "total";
  const deathBlowsMessageDate = new Date();
  deathBlowsMessageDate.setDate(deathBlowsMessageDate.getDate() + 14);
  const formattedDate = deathBlowsMessageDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-6 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <ButtonGroup className="shadow-sm">
            <Button
              onClick={() => handlePeriodChange("total")}
              className={`
                px-4 py-2 text-sm font-medium transition-colors duration-200
                ${selectedPeriod === "total" 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              Total
            </Button>
            <Button
              onClick={() => handlePeriodChange("lastWeek")}
              className={`
                px-4 py-2 text-sm font-medium transition-colors duration-200 border-l-0
                ${selectedPeriod === "lastWeek" 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              Last Week
            </Button>
            <Button
              onClick={() => handlePeriodChange("thisWeek")}
              className={`
                px-4 py-2 text-sm font-medium transition-colors duration-200 border-l-0
                ${selectedPeriod === "thisWeek" 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              This Week
            </Button>
          </ButtonGroup>
          
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="bordered" 
                className="px-4 py-2 text-sm font-medium bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white transition-colors duration-200 shadow-sm min-w-[140px] justify-between"
              >
                {metrics[selectedMetric]} 
                <KeyboardArrowDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              variant="flat"
              aria-label="Leaderboard Metrics"
              className="bg-gray-800 border border-gray-600 shadow-lg rounded-lg min-w-[140px]"
            >
              {Object.entries(metrics).map(([key, label]) => (
                <DropdownItem
                  key={key}
                  onClick={(e) => handleMetricChange(key as Metric, e)}
                  className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {showDeathBlowsMessage && (
        <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
          <p className="text-sm text-gray-300 text-center">
            <span className="text-indigo-400 font-semibold">Death Blows tracking is new!</span>
            <br />
            Weekly data will be accurately reflected starting {formattedDate}.
            <br />
            <span className="text-xs text-gray-400 mt-1 block">
              Total death blows are available now.
            </span>
          </p>
        </div>
      )}

      <ol className="space-y-3">
        {paginatedData.map((item, index) => {
          const metricKey =
            selectedPeriod === "total"
              ? `total${capitalize(selectedMetric)}`
              : `${selectedMetric}${capitalize(selectedPeriod)}`;
          const value = item[metricKey] as number | undefined;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const isTopFive = index < 5;
          const LinkComponent = isTopFive ? HoverPrefetchLink : ViewportPrefetchLink;

          return (
            <li
              key={item.userId}
              className="group bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700/60 hover:border-indigo-500/50 transition-all duration-200 hover:bg-gray-700/90 shadow-sm hover:shadow-md"
            >
              <LinkComponent
                href={`user/${item.userName}/characters`}
                className="flex justify-between items-center w-full h-full p-4 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold text-sm border border-indigo-500/30 group-hover:bg-indigo-600/80 group-hover:text-white group-hover:border-indigo-400/50 transition-all duration-200">
                    {startIndex + index + 1}
                  </div>
                  <span className="text-base font-medium text-gray-200 group-hover:text-indigo-300 transition-colors duration-200">
                    {item.userName}
                  </span>
                </div>
                <span className="text-base font-semibold text-indigo-300 group-hover:text-white transition-colors duration-200">
                  {formatNumber(value)}
                </span>
              </LinkComponent>
            </li>
          );
        })}
      </ol>
      
      <div className="my-8 flex justify-center">
        <Pagination
          total={totalPages}
          initialPage={1}
          onChange={(page) => setCurrentPage(page)}
          showControls
          classNames={{
            wrapper: "gap-1 overflow-visible h-10 rounded-lg bg-gray-800/60 p-2 border border-gray-700/60",
            item: "w-10 h-8 text-small rounded-md bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white transition-colors",
            cursor: "bg-indigo-500 text-white font-semibold shadow-md hover:bg-indigo-400",
            prev: "w-10 h-8 rounded-md bg-transparent text-gray-300 hover:bg-gray-700 hover:text-indigo-400 transition-colors",
            next: "w-10 h-8 rounded-md bg-transparent text-gray-300 hover:bg-gray-700 hover:text-indigo-400 transition-colors",
          }}
        />
      </div>
    </section>
  );
};

export default LeaderboardList;
