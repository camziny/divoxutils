"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";

const UpdateUserName = () => {
  const { user } = useUser();
  const [newUsername, setNewUsername] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdateUsername = async (e: any) => {
    e.preventDefault();
    if (!user) {
      alert("User is not available.");
      return;
    }

    const trimmedUsername = newUsername.trim();

    if (trimmedUsername.length < 3) {
      alert("Username must be at least 3 characters long.");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/users/update-username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      alert("Username updated successfully!");
    } catch (error) {
      alert("Failed to update username.");
      console.error("Failed to update username:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdateUsername} className="flex items-center">
      <input
        type="text"
        placeholder="New username"
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value.trim())}
        className="border border-gray-300 rounded px-2 py-1 mr-2"
      />
      <button
        type="submit"
        disabled={updating}
        className="bg-blue-500 text-white rounded px-4 py-1"
      >
        {updating ? "Updating..." : "Update Username"}
      </button>
    </form>
  );
};

export default UpdateUserName;
