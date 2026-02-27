"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HoverPrefetchLink } from "./HoverPrefetchLink";
import { ViewportPrefetchLink } from "./ViewportPrefetchLink";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SupporterBadge, { supporterRowClass, supporterNameStyle } from "./SupporterBadge";

interface LeaderboardItem {
  userId: number;
  clerkUserId: string;
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
  lastUpdated: Date | null;
  supporterTier: number;
  totalIrs?: number;
  [key: string]: number | string | Date | null | undefined;
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
  const searchParams = useSearchParams();

  const metricParam = searchParams?.get("metric");
  const periodParam = searchParams?.get("period");
  const initialMetric =
    metricParam && metricParam in metrics
      ? (metricParam as Metric)
      : "realmPoints";
  const initialPeriod =
    periodParam && periodParam in periods
      ? (periodParam as Period)
      : "total";
  const initialPage = parseInt(searchParams?.get("page") || "1", 10);

  const [selectedMetric, setSelectedMetric] = useState<Metric>(initialMetric);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialPeriod);
  const [currentPage, setCurrentPage] = useState<number>(
    Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage
  );

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

  const itemsPerPage = 15;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLeaderboardData.slice(startIndex, endIndex);
  }, [sortedLeaderboardData, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    urlParams.set("metric", selectedMetric);
    urlParams.set("period", selectedPeriod);
    urlParams.set("page", currentPage.toString());
    const nextUrl = `${currentUrl.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [selectedMetric, selectedPeriod, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    setCurrentPage(1);
  };

  const formatNumber = (number: number | undefined) => {
    return number === undefined || isNaN(number)
      ? "N/A"
      : new Intl.NumberFormat("en-US").format(number);
  };

  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-6">
        <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-2">
          <div className="inline-flex">
            <Button
              onClick={() => handlePeriodChange("total")}
              variant={selectedPeriod === "total" ? "default" : "secondary"}
              size="sm"
              className="rounded-r-none border-r border-r-gray-700/50 h-auto py-1.5 text-[13px]"
            >
              Total
            </Button>
            <Button
              onClick={() => handlePeriodChange("lastWeek")}
              variant={selectedPeriod === "lastWeek" ? "default" : "secondary"}
              size="sm"
              className="rounded-none border-r border-r-gray-700/50 h-auto py-1.5 text-[13px]"
            >
              Last Week
            </Button>
            <Button
              onClick={() => handlePeriodChange("thisWeek")}
              variant={selectedPeriod === "thisWeek" ? "default" : "secondary"}
              size="sm"
              className="rounded-l-none h-auto py-1.5 text-[13px]"
            >
              This Week
            </Button>
          </div>
          
          <Select
            value={selectedMetric}
            onValueChange={(val) => {
              setSelectedMetric(val as Metric);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-[30px] py-0 w-[132px] text-[13px] leading-none font-medium hover:bg-gray-800/50 hover:text-gray-300 transition-colors duration-150 justify-between whitespace-nowrap [&>span]:truncate">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(metrics).map(([key, label]) => (
                <SelectItem key={key} value={key} className="px-3 py-2 text-sm">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ol className="space-y-2">
        {paginatedData.map((item, index) => {
          const metricKey =
            selectedPeriod === "total"
              ? `total${capitalize(selectedMetric)}`
              : `${selectedMetric}${capitalize(selectedPeriod)}`;
          const value = item[metricKey] as number | undefined;
          
          const startIndex = (currentPage - 1) * itemsPerPage;
          const globalRank = startIndex + index + 1;
          const isTopFive = index < 5;
          const LinkComponent = isTopFive ? HoverPrefetchLink : ViewportPrefetchLink;

          const rankBadge = globalRank === 1
            ? "bg-indigo-500/30 text-indigo-300"
            : globalRank === 2
              ? "bg-indigo-500/20 text-indigo-300"
              : globalRank === 3
                ? "bg-indigo-500/10 text-indigo-400/70"
                : "bg-gray-800 text-gray-500";

          return (
            <li
              key={item.userId}
              className={`group rounded-md border border-gray-800 hover:border-gray-700 hover:bg-gray-800/40 transition-colors duration-150 relative overflow-hidden ${supporterRowClass(item.supporterTier)}`}
            >
              <LinkComponent
                href={`/user/${item.userName}/characters`}
                className="flex justify-between items-center w-full h-full px-4 py-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold tabular-nums ${rankBadge}`}>
                    {globalRank}
                  </div>
                  <span className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors duration-150 inline-flex items-center gap-1" style={supporterNameStyle(item.supporterTier)}>
                    {item.userName}
                    {item.supporterTier > 0 && <SupporterBadge tier={item.supporterTier} />}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-300 tabular-nums">
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
          page={currentPage}
          onChange={handlePageChange}
        />
      </div>
    </section>
  );
};

export default LeaderboardList;
