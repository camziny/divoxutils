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
    <div className="w-full">
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700/30 -mx-2 px-2">
        <div className="container mx-auto py-2">
          <div 
            className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex gap-1 sm:gap-2 justify-center min-w-max px-2">
              {alphabet.map((letter) => (
                <a
                  key={letter}
                  href={`#group-${letter}`}
                  className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-1 rounded-md transition-all duration-200 font-medium text-xs sm:text-sm min-w-[24px] sm:min-w-[28px] text-center flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(`group-${letter}`);
                    if (element) {
                      const yOffset = -60;
                      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 mt-4">
        {alphabet.map((letter, index) => {
          return (
            <div
              key={letter}
              id={`group-${letter}`}
              className="mb-6"
            >
              <h3 className="font-semibold text-lg text-white mb-3">
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
