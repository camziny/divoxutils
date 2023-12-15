"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Pagination,
  Skeleton,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface LeaderboardItem {
  userId: number;
  userName: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  irs: number;
  irsLastWeek: number;
  [key: string]: number | string;
}

interface LeaderboardListProps {
  data: LeaderboardItem[];
}

const categories: Record<LeaderboardCategory, string> = {
  totalRealmPoints: "Total Realm Points",
  realmPointsLastWeek: "Realm Points Last Week",
  totalSoloKills: "Total Solo Kills",
  soloKillsLastWeek: "Solo Kills Last Week",
  totalDeaths: "Total Deaths",
  deathsLastWeek: "Deaths Last Week",
  irs: "Total IRS",
  irsLastWeek: "IRS Last Week",
};

type LeaderboardCategory =
  | "totalRealmPoints"
  | "realmPointsLastWeek"
  | "totalSoloKills"
  | "soloKillsLastWeek"
  | "totalDeaths"
  | "deathsLastWeek"
  | "irs"
  | "irsLastWeek";

interface LeaderboardListProps {
  data: LeaderboardItem[];
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] =
    useState<LeaderboardCategory>("totalRealmPoints");
  const sortedLeaderboardData = sortLeaderboardData(data, selectedCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedLeaderboardData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (category: LeaderboardCategory) => {
    setSelectedCategory(category);
  };

  function formatNumber(number: number) {
    return isNaN(number)
      ? "N/A"
      : new Intl.NumberFormat("en-US").format(number);
  }

  function sortLeaderboardData(
    leaderboardData: LeaderboardItem[],
    selectedCategory: LeaderboardCategory
  ) {
    return leaderboardData.sort(
      (a, b) => b[selectedCategory] - a[selectedCategory]
    );
  }

  const isLoading = !data || data.length === 0;

  const renderSkeletons = () => {
    return [...Array(15)].map((_, index) => <Skeleton key={index} />);
  };

  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-4">
        <Dropdown backdrop="blur">
          <DropdownTrigger>
            <Button variant="bordered" className="text-indigo-500">
              {categories[selectedCategory] as string} <KeyboardArrowDownIcon />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            variant="faded"
            aria-label="Leaderboard Categories"
            className="bg-gray-900 text-indigo-400"
          >
            {Object.entries(categories).map(([key, label]) => (
              <DropdownItem
                key={key}
                onClick={() => handleCategoryChange(key as LeaderboardCategory)}
              >
                {label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <ol className="space-y-4">
        {isLoading
          ? renderSkeletons()
          : paginatedData.map((item, index) => (
              <li
                key={item.userId}
                className="bg-gray-800 p-4 rounded-md hover:bg-gray-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <Link
                  href={`/users/${item.clerkUserId}/characters`}
                  className="flex justify-between items-center w-full h-full text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <span className="flex-grow flex items-center">
                    <span className="text-xl mr-2 font-bold">
                      {startIndex + index + 1}.
                    </span>
                    <span className="text-lg">{item.userName}</span>
                  </span>
                  <span className="text-white font-bold">
                    {formatNumber(item[selectedCategory])}
                  </span>
                </Link>
              </li>
            ))}
      </ol>

      <div className="my-4 flex justify-center">
        <Pagination
          total={Math.ceil(data.length / itemsPerPage)}
          initialPage={1}
          onChange={(page) => setCurrentPage(page)}
          classNames={{
            wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
            item: "w-8 h-8 text-small rounded-none bg-transparent text-white",
            cursor:
              "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
          }}
        />
      </div>
    </section>
  );
};

export default LeaderboardList;
