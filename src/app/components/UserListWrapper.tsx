import React from "react";
import UserListClient from "./UserListClient";
import { getPublicUsers, groupUsersByLetter } from "@/server/users";

export default async function UserListWrapper() {
  try {
    const users = await getPublicUsers();
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