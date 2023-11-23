import React from "react";
import Link from "next/link";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, useEffect } from "react";
import UserListSkeleton from "./UserListSkeleton";

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
      const firstLetter = user.name[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(user);
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
    return <div>No users available</div>;
  }

  return (
    <div className="w-full mt-8 px-2 relative">
      <div className="sticky top-10 left-0 z-10 bg-gray-900 py-2">
        <div className="flex justify-center mb-4 overflow-x-auto">
          {alphabet.map((letter) => (
            <a
              key={letter}
              href={`#group-${letter}`}
              className="text-indigo-500 hover:text-indigo-400 mx-1"
            >
              {letter}
            </a>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto w-full">
        {alphabet.map((letter, index) => {
          const isNotFirst = index !== 0;
          return (
            <div
              key={letter}
              id={`group-${letter}`}
              className={`${isNotFirst ? "pt-14 -mt-14" : ""} mb-4`}
            >
              <h3
                className={`font-bold text-xl text-white mb-2 ${
                  isNotFirst ? "sticky top-14 bg-gray-900" : ""
                }`}
              >
                {letter}
              </h3>
              <ul className="divide-y divide-gray-700">
                {groupedUsers[letter].map((user) => (
                  <Link
                    key={user.id}
                    href={`/users/${user.clerkUserId}/characters`}
                  >
                    <li className="text-indigo-400 hover:text-indigo-300 cursor-pointer p-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-md">
                      {user.name}
                    </li>
                  </Link>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList;
