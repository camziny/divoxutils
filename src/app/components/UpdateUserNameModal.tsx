"use client";
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewUsername("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = newUsername.trim();
  const canSubmit = !updating && trimmed.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Session expired.");
      return;
    }
    if (!canSubmit) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/users/update-username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Something went wrong.");
      }
      onUserNameUpdated(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md mx-4 p-6 shadow-lg">
        {/* Header */}
        <div className="space-y-1.5 mb-6">
          <h2 className="text-lg font-semibold text-white leading-none tracking-tight">
            Update username
          </h2>
          <p className="text-sm text-gray-400">
            Choose a new display name for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 mb-6">
            <label
              htmlFor="username-input"
              className="text-sm font-medium leading-none text-gray-200"
            >
              Username
            </label>
            <input
              id="username-input"
              ref={inputRef}
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter a username"
              disabled={updating}
              spellCheck={false}
              autoComplete="off"
              className={cn(
                "flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-white ring-offset-gray-950 transition-colors",
                "placeholder:text-gray-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error
                  ? "border-red-500/50 focus-visible:ring-red-500/40"
                  : "border-gray-800 focus-visible:ring-indigo-500/40"
              )}
            />
            {error ? (
              <p className="text-[0.8rem] font-medium text-red-400">
                {error}
              </p>
            ) : (
              <p className="text-[0.8rem] text-gray-500">
                Must be at least 3 characters.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {updating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UpdateUsernameModal;
