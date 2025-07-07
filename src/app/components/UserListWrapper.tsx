import React from 'react';
import UserListClient from './UserListClient';

type User = {
  id: number;
  clerkUserId: string;
  name: string;
};

type GroupedUsers = {
  [letter: string]: User[];
};

async function fetchUsers(): Promise<User[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users`;
  const response = await fetch(apiUrl, {
    next: { 
      revalidate: 300,
      tags: ['users']
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function groupUsersByLetter(users: User[]): GroupedUsers {
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
}

export default async function UserListWrapper() {
  try {
    const users = await fetchUsers();
    const groupedUsers = groupUsersByLetter(users);
    
    return <UserListClient initialData={groupedUsers} />;
  } catch (error) {
    console.error("Error fetching users:", error);
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Failed to load users. Please try again later.</div>
      </div>
    );
  }
} 