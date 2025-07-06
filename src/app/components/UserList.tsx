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
      <div className="hidden sm:block sticky top-20 z-30 bg-gray-900/98 backdrop-blur-sm -mx-2 px-2 shadow-lg">
        <div className="container mx-auto py-1.5 px-4">
          <div className="flex flex-nowrap justify-center gap-0.5 max-w-none overflow-x-auto 
            [&::-webkit-scrollbar]:h-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-600/50
            [&::-webkit-scrollbar-thumb]:rounded-full">
            {alphabet.map((letter) => (
              <a
                key={letter}
                href={`#group-${letter}`}
                className="text-gray-400 hover:text-white bg-gray-800/60 hover:bg-indigo-500/25 border border-gray-700/30 hover:border-indigo-500/50 px-1.5 py-0.5 rounded transition-all duration-200 font-medium text-xs min-w-[24px] text-center shadow-sm hover:shadow-indigo-500/10 active:scale-95 whitespace-nowrap flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(`group-${letter}`);
                  if (element) {
                    const navbarHeight = 80;
                    const stickyNavHeight = 40;
                    const yOffset = -(navbarHeight + stickyNavHeight + 10);
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

      <div className="px-2 mt-4 sm:mt-6">
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
