import React from "react";
import Link from "next/link";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, useEffect } from "react";
import UserListSkeleton from "./UserListSkeleton";
import useDebounce from "./UseDebounce";

type User = {
  id: number;
  clerkUserId: string;
  name: string;
};

type GroupedUsers = {
  [letter: string]: User[];
};

async function fetchUsers(): Promise<GroupedUsers> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users`
    );
    if (!response.ok) {
      throw new Error(`Fetch response error: ${response.statusText}`);
    }
    const users: User[] = await response.json();

    const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));
    return sortedUsers.reduce((acc: GroupedUsers, user: User) => {
      if (typeof user.name === "string" && user.name.length > 0) {
        const firstLetter = user.name[0].toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(user);
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching users:", error);
    return {};
  }
}

const UserList: React.FC = () => {
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      setIsLoading(true);
      try {
        const users = await fetchUsers();
        setGroupedUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getUsers();
  }, []);

  const alphabet = Object.keys(groupedUsers).sort();

  if (isLoading) {
    return <UserListSkeleton />;
  }

  if (alphabet.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">No users available</div>
      </div>
    );
  }

  return (
    <div className="w-full mt-0 px-2 relative">
      <div className="sticky top-0 left-0 z-10 bg-gray-900 py-3 border-b border-gray-700/30">
        <div className="flex justify-center flex-wrap gap-2 overflow-x-auto max-w-4xl mx-auto">
          {alphabet.map((letter) => (
            <a
              key={letter}
              href={`#group-${letter}`}
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-1 rounded-md transition-all duration-200 font-medium text-sm min-w-[28px] text-center"
            >
              {letter}
            </a>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto w-full mt-4">
        {alphabet.map((letter, index) => {
          const isNotFirst = index !== 0;
          return (
            <div
              key={letter}
              id={`group-${letter}`}
              className={`${isNotFirst ? "pt-14 -mt-14" : ""} mb-6`}
            >
              <h3
                className={`font-semibold text-lg text-white mb-3 ${
                  isNotFirst ? "sticky top-14 bg-gray-900 py-2" : ""
                }`}
              >
                {letter}
              </h3>
              <div className="space-y-1">
                {groupedUsers[letter].map((user) => (
                  <Link key={user.id} href={`user/${user.name}/characters`}>
                    <div className="text-indigo-400 hover:text-indigo-300 hover:bg-gray-800/30 cursor-pointer py-2 px-3 rounded-md transition-all duration-200 text-sm">
                      {user.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList;
