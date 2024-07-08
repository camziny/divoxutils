"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Pagination,
  Skeleton,
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
  irs: "IRS",
};

const periods = {
  total: "",
  lastWeek: "Last Week",
  thisWeek: "This Week",
};

type Metric = keyof typeof metrics;
type Period = keyof typeof periods;

const LeaderboardList: React.FC<LeaderboardListProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("realmPoints");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("total");

  useEffect(() => {}, [selectedMetric, selectedPeriod, data]);

  const processedData = data.map((item) => {
    const totalIrs =
      item.totalDeaths > 0
        ? Math.round(item.totalRealmPoints / item.totalDeaths)
        : item.totalRealmPoints;
    return { ...item, totalIrs };
  });

  const sortedLeaderboardData = sortLeaderboardData(
    processedData,
    selectedMetric,
    selectedPeriod
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedLeaderboardData.slice(startIndex, endIndex);

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

  function sortLeaderboardData(
    leaderboardData: LeaderboardItem[],
    selectedMetric: Metric,
    selectedPeriod: Period
  ) {
    const metricKey =
      selectedPeriod === "total"
        ? `total${capitalize(selectedMetric)}`
        : `${selectedMetric}${capitalize(selectedPeriod)}`;
    console.log(`Metric Key: ${metricKey}`);

    return leaderboardData.sort(
      (a, b) => (b[metricKey] as number) - (a[metricKey] as number)
    );
  }

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  const isLoading = !data || data.length === 0;

  const renderSkeletons = () => {
    return [...Array(15)].map((_, index) => <Skeleton key={index} />);
  };

  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-4 flex flex-col items-center">
        <ButtonGroup className="mb-4 relative">
          <Button
            onClick={() => handlePeriodChange("total")}
            className={`bg-gray-800 text-indigo-400 ${
              selectedPeriod === "total" ? "border-2  border-indigo-500" : ""
            }`}
          >
            Total
          </Button>
          <Button
            onClick={() => handlePeriodChange("lastWeek")}
            className={`bg-gray-800 text-indigo-400 ${
              selectedPeriod === "lastWeek" ? "border-2 border-indigo-500" : ""
            }`}
          >
            Last Week
          </Button>
          <Button
            onClick={() => handlePeriodChange("thisWeek")}
            className={`bg-gray-800 text-indigo-400 ${
              selectedPeriod === "thisWeek" ? "border-2 border-indigo-500" : ""
            }`}
          >
            This Week
          </Button>
        </ButtonGroup>
        <Dropdown backdrop="blur">
          <DropdownTrigger>
            <Button variant="bordered" className="text-indigo-500">
              {metrics[selectedMetric]} <KeyboardArrowDownIcon />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            variant="faded"
            aria-label="Leaderboard Metrics"
            className="bg-gray-900 text-indigo-400"
          >
            {Object.entries(metrics).map(([key, label]) => (
              <DropdownItem
                key={key}
                onClick={(e) => handleMetricChange(key as Metric, e)}
              >
                {label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <>
        <ol className="space-y-4">
          {isLoading
            ? renderSkeletons()
            : paginatedData.map((item, index) => {
                const metricKey =
                  selectedPeriod === "total"
                    ? `total${capitalize(selectedMetric)}`
                    : `${selectedMetric}${capitalize(selectedPeriod)}`;
                const value = item[metricKey] as number | undefined;

                console.log(
                  `User: ${item.userName}, Metric Key: ${metricKey}, Value: ${value}`
                );

                return (
                  <li
                    key={item.userId}
                    className="bg-gray-800 p-4 rounded-md hover:bg-gray-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
                  >
                    <Link
                      href={`user/${item.userName}/characters`}
                      className="flex justify-between items-center w-full h-full text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <span className="flex-grow flex items-center">
                        <span className="text-xl mr-2 font-bold">
                          {startIndex + index + 1}.
                        </span>
                        <span className="text-lg">{item.userName}</span>
                      </span>
                      <span className="text-white font-bold">
                        {formatNumber(value)}
                      </span>
                    </Link>
                  </li>
                );
              })}
        </ol>
        <div className="my-4 flex justify-center">
          <Pagination
            total={Math.ceil(data.length / itemsPerPage)}
            initialPage={1}
            onChange={(page) => setCurrentPage(page)}
            classNames={{
              wrapper:
                "gap-0 overflow-visible h-8 rounded border border-divider",
              item: "w-8 h-8 text-small rounded-none bg-transparent text-white",
              cursor:
                "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
            }}
          />
        </div>
      </>
    </section>
  );
};

export default LeaderboardList;
