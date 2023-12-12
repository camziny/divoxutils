"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";

type ClerkUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  emailAddresses: { id: string; emailAddress: string }[];
  primaryEmailAddressId: string;
};

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

    const clerkUser = user as ClerkUser;
    const primaryEmailId =
      clerkUser.primaryEmailAddressId || "default_email_id";

    const requestBody = {
      data: {
        id: clerkUser.id,
        username: trimmedUsername,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        email_addresses: clerkUser.emailAddresses.map((email) => ({
          id: email.id || "default_email_id",
          email_address: email.emailAddress,
        })),
        primary_email_address_id: primaryEmailId,
      },
    };

    try {
      const response = await fetch("/api/clerk-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
