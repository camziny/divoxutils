"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import AccountDeleteConfirmModal, {
  SearchResult,
} from "./AccountDeleteConfirmModal";

export default function AdminAccountsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<SearchResult | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/admin/accounts/search?q=${encodeURIComponent(searchQuery)}`
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Search failed.");
        }
        setSearchResults(Array.isArray(payload?.users) ? payload.users : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const openConfirm = useCallback((user: SearchResult) => {
    setConfirmTarget(user);
    setConfirmInput("");
    setError(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmTarget(null);
    setConfirmInput("");
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirmTarget) return;

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/accounts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: confirmTarget.clerkUserId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Delete failed.");
      }

      const displayName = confirmTarget.name ?? confirmTarget.clerkUserId;
      const note = payload?.note ? ` (${payload.note})` : "";
      setSuccessMessage(`Account "${displayName}" deleted successfully.${note}`);
      setTimeout(() => setSuccessMessage(null), 5000);

      setSearchResults((prev) =>
        prev.filter((u) => u.clerkUserId !== confirmTarget.clerkUserId)
      );
      closeConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }, [confirmTarget, closeConfirm]);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Admin
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-lg font-medium tracking-tight text-gray-100">
            Account Removal
          </h1>
          <p className="mt-0.5 text-xs text-gray-600">
            Search by username, email, or Discord ID to find and remove an
            account.
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2 text-xs text-gray-300">
            {successMessage}
          </div>
        )}

        {error && !confirmTarget && (
          <div className="mb-4 rounded-md border border-red-900/30 bg-red-950/20 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-gray-900"
          />

          {searching && (
            <p className="mt-3 text-xs text-gray-600">Searching...</p>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="mt-3 text-xs text-gray-600">No users found.</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-3 rounded-md border border-gray-800 divide-y divide-gray-800/80">
              {searchResults.map((user) => {
                const discord = user.identityLinks.find(
                  (l) => l.provider === "discord"
                );
                return (
                  <div
                    key={user.clerkUserId}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-200 truncate">
                          {user.name ?? "No username"}
                        </span>
                        <span className="text-xs text-gray-600 hidden sm:inline truncate">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-600">
                        <span className="tabular-nums">
                          {user.characters.length} char{user.characters.length !== 1 ? "s" : ""}
                        </span>
                        {discord && (
                          <span className="font-mono truncate">
                            {discord.providerUserId}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openConfirm(user)}
                      className="shrink-0 rounded-md border border-gray-800 px-2.5 py-1 text-xs text-gray-500 hover:border-red-900/60 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmTarget && (
        <AccountDeleteConfirmModal
          confirmTarget={confirmTarget}
          confirmInput={confirmInput}
          deleting={deleting}
          error={error}
          onClose={closeConfirm}
          onConfirmInputChange={setConfirmInput}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
