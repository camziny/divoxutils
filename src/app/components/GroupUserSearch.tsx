"use client";
import React, { useState, useEffect } from "react";
import useDebounce from "./UseDebounce";
import { Input, Button } from "@nextui-org/react";

const GroupUserSearch: React.FC<{ groupId: number }> = ({ groupId }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]); // Adjust the type based on your user object

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const fetchUsers = async () => {
        try {
          const response = await fetch(
            `/api/users/search?name=${debouncedSearchTerm}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch users");
          }
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch(`/api/group/${groupId}/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: selectedUser }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error adding user to group:", error);
    }
  };

  return (
    <div>
      <Input
        size="md"
        type="text"
        placeholder="Search Users to Add"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        classNames={{
          label: "text-gray-500 dark:text-gray-300",
          input: [
            "bg-transparent",
            "text-gray-800 dark:text-gray-200",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          ],
          innerWrapper: "bg-transparent",
          inputWrapper: [
            "shadow-xl",
            "bg-gray-800",
            "dark:bg-gray-700",
            "hover:bg-gray-700 dark:hover:bg-gray-600",
            "group-data-[focused=true]:bg-gray-800 dark:group-data-[focused=true]:bg-gray-700",
            "focus:border-indigo-600",
            "!cursor-text",
          ],
        }}
      />

      {searchResults.map((user) => (
        <div key={user.id} onClick={() => handleUserSelect(user.id)}>
          {user.name}
        </div>
      ))}
      <Button onClick={handleAddUser} disabled={!selectedUser}>
        Add User
      </Button>
    </div>
  );
};

export default GroupUserSearch;
