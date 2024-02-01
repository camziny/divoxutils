"use client";
import React, { useState, useEffect } from "react";
import useDebounce from "./UseDebounce";
import { Input, Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import Loading from "../loading";
import { User, GroupUserSearchProps } from "@/utils/group";
import { toast } from "react-toastify";

const GroupUserSearch: React.FC<GroupUserSearchProps> = ({
  clerkUserId,
  group,
  onUserAdd,
}) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setIsLoading(false);
        setSearchPerformed(false);
        return;
      }

      setIsLoading(true);
      setSearchPerformed(true);
      try {
        const response = await fetch(`/api/users?name=${debouncedQuery}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const users = await response.json();
        const updatedUsers = users.map((user: User) => ({
          ...user,
          selected: false,
        }));
        setSearchResults(updatedUsers);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery]);

  const toggleUserSelection = (clerkUserId: string) => {
    setSearchResults((prevResults) =>
      prevResults.map((user) =>
        user.clerkUserId === clerkUserId
          ? { ...user, selected: !user.selected }
          : user
      )
    );
  };

  const handleAddUser = async () => {
    const selectedUsers = searchResults.filter((user) => user.selected);
    if (selectedUsers.length === 0) {
      console.error("No users selected");
      return;
    }

    try {
      await Promise.all(
        selectedUsers.map(async (user) => {
          const response = await fetch(`/api/group/addUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupOwnerClerkUserId: clerkUserId,
              memberClerkUserId: user.clerkUserId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        })
      );

      selectedUsers.forEach((user: any) => {
        onUserAdd({
          id: user.id,
          clerkUserId: user.clerkUserId,
          name: user.name,
          characters: user.characters || [],
          selectedRealm: "PvP",
        });
      });

      setSearchResults((prevResults) =>
        prevResults.map((user) => ({ ...user, selected: false }))
      );
      setQuery("");
      setSearchPerformed(false);
      router.refresh();
      toast.success("User(s) Successfully Added", { position: "bottom-left" });
    } catch (error) {
      console.error("Error adding user to group:", error);
      toast.error("Error adding user to group", { position: "bottom-left" });
    }
  };

  const isAnyUserSelected = searchResults.some((user) => user.selected);

  return (
    <div className="bg-gray-900 p-2 rounded-lg">
      <div className="flex justify-center items-center">
        <div className="w-full md:max-w-md">
          <Input
            size="md"
            type="text"
            placeholder="Search Users to Add"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <div className="w-full md:max-w-md">
          {isLoading ? (
            <div className="flex justify-center">
              <Loading />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isSelected = user.selected;
              const itemClass = isSelected
                ? "mb-2 bg-indigo-900/70 p-2 rounded-md text-white flex items-center cursor-pointer"
                : "mb-2 bg-gray-800 p-2 rounded-md text-gray-300 flex items-center cursor-pointer";

              return (
                <div
                  key={user.clerkUserId}
                  className={itemClass}
                  onClick={() => toggleUserSelection(user.clerkUserId)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    className="mr-2 pointer-events-none"
                  />
                  <div className="flex-grow">
                    <span className="text-white text-lg">{user.name}</span>
                  </div>
                </div>
              );
            })
          ) : searchPerformed ? (
            <div className="mt-2 text-white text-center">No users found</div>
          ) : null}
        </div>
      </div>
      <div className="flex justify-center mt-1 space-x-4">
        {searchPerformed && (
          <Button
            onClick={handleAddUser}
            disabled={!isAnyUserSelected}
            className={`flex items-center space-x-2 text-md font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ${
              !isAnyUserSelected
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "bg-indigo-400 hover:bg-indigo-500 text-white"
            }`}
          >
            <span>Add User</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupUserSearch;
