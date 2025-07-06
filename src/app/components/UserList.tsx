import React from "react";
import Link from "next/link";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, useEffect, useRef } from "react";
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
  const [navTopPosition, setNavTopPosition] = useState<number>(200);
  const userListRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const updateNavPosition = () => {
      if (userListRef.current) {
        const rect = userListRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setNavTopPosition(rect.top + scrollTop);
      }
    };

    updateNavPosition();
    window.addEventListener('resize', updateNavPosition);
    return () => window.removeEventListener('resize', updateNavPosition);
  }, [groupedUsers]);

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
    <div className="w-full relative">
      <div className="hidden sm:block sticky top-20 z-30 bg-gray-900/98 backdrop-blur-sm -mx-2 px-2 shadow-lg">
        <div className="container mx-auto py-2 px-4">
          <div className="flex flex-wrap justify-center gap-1 max-w-2xl mx-auto">
            {alphabet.map((letter) => (
              <a
                key={letter}
                href={`#group-${letter}`}
                className="text-gray-400 hover:text-white bg-gray-800/60 hover:bg-indigo-500/25 border border-gray-700/30 hover:border-indigo-500/50 px-2 py-1 rounded-md transition-all duration-200 font-medium text-xs min-w-[28px] text-center shadow-sm hover:shadow-indigo-500/10 active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(`group-${letter}`);
                  if (element) {
                    const navbarHeight = 80;
                    const stickyNavHeight = 50;
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

      <div 
        className="sm:hidden fixed right-0 bottom-2 z-30"
        style={{ top: `${navTopPosition}px` }}
      >
        <div className="flex flex-col h-full max-h-[calc(100vh-220px)] overflow-y-auto 
          [&::-webkit-scrollbar]:w-[3px] 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-gray-600/50 
          [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex flex-col gap-[1px] pr-0.5 py-1">
            {alphabet.map((letter) => (
              <a
                key={letter}
                href={`#group-${letter}`}
                className="text-[9px] xs:text-[10px] leading-tight text-gray-400 hover:text-white 
                  px-1 xs:px-1.5 py-[3px] xs:py-1 
                  rounded-l transition-colors duration-150 
                  font-medium text-center 
                  active:scale-95 min-w-[18px] xs:min-w-[20px]"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(`group-${letter}`);
                  if (element) {
                    const navbarHeight = 80;
                    const yOffset = -navbarHeight - 10;
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

      <div ref={userListRef} className="px-2 mt-4 sm:mt-6">
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
