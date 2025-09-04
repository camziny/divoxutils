"use client";
import React, { useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HoverPrefetchLink } from "./HoverPrefetchLink";
import { ViewportPrefetchLink } from "./ViewportPrefetchLink";
import { Button, Pagination, ButtonGroup } from "@nextui-org/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const router = useRouter();
  const pathname = usePathname();

  const selectedMetric = (searchParams?.get('metric') as Metric) || 'realmPoints';
  const selectedPeriod = (searchParams?.get('period') as Period) || 'total';
  const pageString = searchParams?.get('page') || '1';
  const currentPage = parseInt(pageString, 10);

  const updateURL = (updates: { metric?: Metric; period?: Period; page?: number }) => {
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    
    if (updates.metric !== undefined) {
      urlParams.set('metric', updates.metric);
    }
    if (updates.period !== undefined) {
      urlParams.set('period', updates.period);
    }
    if (updates.page !== undefined) {
      urlParams.set('page', updates.page.toString());
    }
    
    if (!urlParams.has('metric')) {
      urlParams.set('metric', 'realmPoints');
    }
    if (!urlParams.has('period')) {
      urlParams.set('period', 'total');
    }
    
    const newUrl = `${pathname}?${urlParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

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
      const currentUrl = new URL(window.location.href);
      const urlParams = new URLSearchParams(currentUrl.search);
      
      urlParams.set('page', '1');
      
      if (!urlParams.has('metric')) {
        urlParams.set('metric', selectedMetric);
      }
      if (!urlParams.has('period')) {
        urlParams.set('period', selectedPeriod);
      }
      
      const newUrl = `${pathname}?${urlParams.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  }, [currentPage, totalPages, pathname, router, selectedMetric, selectedPeriod]);

  const handlePageChange = (page: number) => {
    const currentUrl = new URL(window.location.href);
    const currentUrlParams = new URLSearchParams(currentUrl.search);
    
    const newUrlParams = new URLSearchParams();
    
    currentUrlParams.forEach((value, key) => {
      newUrlParams.set(key, value);
    });
    
    newUrlParams.set('page', page.toString());
    
    if (!newUrlParams.has('metric')) {
      newUrlParams.set('metric', selectedMetric);
    }
    if (!newUrlParams.has('period')) {
      newUrlParams.set('period', selectedPeriod);
    }
    
    const newUrl = `${pathname}?${newUrlParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  

  const handlePeriodChange = (period: Period) => {
    updateURL({ period, page: 1 });
  };

  const formatNumber = (number: number | undefined) => {
    return number === undefined || isNaN(number)
      ? "N/A"
      : new Intl.NumberFormat("en-US").format(number);
  };

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
          
          <Select
            value={selectedMetric}
            onValueChange={(val) => updateURL({ metric: val as Metric, page: 1 })}
          >
            <SelectTrigger className="text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors duration-200 shadow-sm min-w-[140px] justify-between">
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
          page={currentPage}
          onChange={handlePageChange}
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
