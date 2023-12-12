"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";

type UpdateUsernameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserNameUpdated: (newUsername: string) => void;
};

const UpdateUsernameModal: React.FC<UpdateUsernameModalProps> = ({
  isOpen,
  onClose,
  onUserNameUpdated,
}) => {
  const { user } = useUser();
  const [newUsername, setNewUsername] = useState("");
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

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

    const primaryEmailId = user.primaryEmailAddressId || "default_email_id";
    const requestBody = {
      data: {
        id: user.id,
        username: trimmedUsername,
        first_name: user.firstName,
        last_name: user.lastName,
        email_addresses: user.emailAddresses.map((email) => ({
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
      onUserNameUpdated(newUsername);
      alert("Username updated successfully!");
    } catch (error) {
      alert("Failed to update username.");
      console.error("Failed to update username:", error);
    } finally {
      setUpdating(false);
      onClose();
    }
  };

  const resetAndClose = () => {
    setNewUsername("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <form
          onSubmit={handleUpdateUsername}
          className="flex flex-col items-center space-y-4"
        >
          <input
            type="text"
            placeholder="New username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-gray-200 text-indigo-900 font-semibold"
          />
          <button
            type="submit"
            disabled={updating}
            className="w-full bg-indigo-500 text-white rounded px-4 py-2 hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
          >
            {updating ? "Updating..." : "Update Username"}
          </button>
          <button
            onClick={resetAndClose}
            className="w-full text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateUsernameModal;
