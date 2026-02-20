"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SupporterBadge, { SUPPORTER_TIERS } from "@/app/components/SupporterBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Supporter = {
  id: number;
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
  supporterAmount: number;
};

type SearchUser = {
  id: number;
  clerkUserId: string;
  name: string | null;
  supporterTier: number;
  supporterAmount: number;
};

export default function AdminSupportersClient() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [donationAmounts, setDonationAmounts] = useState<Record<string, string>>({});

  const loadSupporters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/supporters");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Failed to load supporters.");
      setSupporters(Array.isArray(payload?.supporters) ? payload.supporters : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load supporters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupporters();
  }, [loadSupporters]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/admin/supporters/search?q=${encodeURIComponent(searchQuery)}`);
        const payload = await response.json();
        if (response.ok) {
          setSearchResults(Array.isArray(payload?.users) ? payload.users : []);
        }
      } catch {
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addDonation = useCallback(async (clerkUserId: string) => {
    const rawAmount = donationAmounts[clerkUserId];
    const amount = parseFloat(rawAmount);
    if (!rawAmount || isNaN(amount) || amount <= 0) {
      setError("Enter a valid dollar amount.");
      return;
    }

    setUpdatingId(clerkUserId);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/admin/supporters/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId, addAmount: amount }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Failed to add donation.");

      const tierLabel = payload.supporterTier > 0 ? `Tier ${payload.supporterTier}` : "no tier";
      setSuccessMessage(`Added $${amount}. Total: $${payload.supporterAmount} (${tierLabel}).`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setDonationAmounts((prev) => ({ ...prev, [clerkUserId]: "" }));
      await loadSupporters();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add donation.");
    } finally {
      setUpdatingId(null);
    }
  }, [donationAmounts, loadSupporters]);

  const nextTierInfo = (amount: number) => {
    const thresholds = [20, 50, 100];
    const next = thresholds.find((t) => amount < t);
    if (!next) return null;
    return { threshold: next, remaining: Math.ceil((next - amount) * 100) / 100 };
  };

  const DonationInput = ({ clerkUserId }: { clerkUserId: string }) => (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
        <Input
          type="number"
          min="1"
          step="1"
          placeholder="0"
          value={donationAmounts[clerkUserId] ?? ""}
          onChange={(e) => setDonationAmounts((prev) => ({ ...prev, [clerkUserId]: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && addDonation(clerkUserId)}
          className="w-24 pl-6 h-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        onClick={() => addDonation(clerkUserId)}
        disabled={updatingId === clerkUserId}
      >
        {updatingId === clerkUserId ? "Adding..." : "Add"}
      </Button>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
              Admin
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-2xl font-semibold tracking-tight">Supporters</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Log Ko-fi donations to track cumulative contributions. Tiers are assigned automatically.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-800/50 bg-red-900/20 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-md border border-green-800/50 bg-green-900/20 px-4 py-2.5 text-sm text-green-400">
            {successMessage}
          </div>
        )}

        <div className="mb-8">
          <label className="block text-xs font-medium text-gray-400 mb-2">Add donation</label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
          />

          {searching && (
            <p className="mt-2 text-xs text-gray-500">Searching...</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-2 rounded-md border border-gray-700 bg-gray-800/50 divide-y divide-gray-700/50">
              {searchResults.map((user) => (
                <div key={user.clerkUserId} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">{user.name ?? user.clerkUserId}</span>
                      {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} />}
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">${user.supporterAmount.toFixed(2)} total</span>
                  </div>
                  <DonationInput clerkUserId={user.clerkUserId} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Current supporters</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-md bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : supporters.length === 0 ? (
            <p className="text-sm text-gray-600">No supporters yet.</p>
          ) : (
            <div className="rounded-md border border-gray-800 divide-y divide-gray-800">
              {supporters.map((supporter) => {
                const next = nextTierInfo(supporter.supporterAmount);
                return (
                  <div key={supporter.clerkUserId} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SupporterBadge tier={supporter.supporterTier} />
                        <span className="text-sm text-gray-200">{supporter.name ?? supporter.clerkUserId}</span>
                        <span className="text-[11px] text-gray-500">Tier {supporter.supporterTier}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 tabular-nums">${supporter.supporterAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <DonationInput clerkUserId={supporter.clerkUserId} />
                      {next && (
                        <span className="text-[11px] text-gray-600">${next.remaining} to Tier {next.threshold === 20 ? 1 : next.threshold === 50 ? 2 : 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-md border border-gray-800 p-4">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Tier thresholds</h3>
          <div className="space-y-2">
            {SUPPORTER_TIERS.map(({ tier, label, threshold }) => (
              <div key={tier} className="flex items-center gap-2.5">
                <SupporterBadge tier={tier} size="md" />
                <span className="text-sm text-gray-300">{label}</span>
                <span className="text-xs text-gray-500">{threshold} cumulative</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
