"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BackfillResponse = {
  dryRun: boolean;
  limit: number | null;
  summary: {
    scannedUsers: number;
    linked: number;
    skippedNoDiscord: number;
    skippedAlreadyLinkedToOther: number;
    skippedErrors: number;
    errors: Array<{ clerkUserId: string; reason: string }>;
  };
};

export default function AdminIdentityLinkingClient() {
  const [limit, setLimit] = useState("500");
  const [running, setRunning] = useState<"dry" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackfillResponse | null>(null);

  async function runBackfill(mode: "dry" | "apply") {
    setRunning(mode);
    setError(null);
    try {
      const numericLimit = Number(limit);
      const response = await fetch("/api/admin/identity-linking/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: mode === "dry",
          limit: Number.isFinite(numericLimit) && numericLimit > 0 ? numericLimit : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Backfill request failed.");
      }
      setResult(payload as BackfillResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Backfill request failed.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
              Admin
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-2xl font-semibold tracking-tight">Identity Backfill</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Link existing users to Discord where possible using Clerk Discord account IDs.
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Users to scan (optional)</label>
            <Input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="500"
              type="number"
              min="1"
              max="2000"
              className="w-40"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => runBackfill("dry")}
              disabled={running !== null}
            >
              {running === "dry" ? "Running dry run..." : "Dry Run"}
            </Button>
            <Button
              onClick={() => runBackfill("apply")}
              disabled={running !== null}
            >
              {running === "apply" ? "Applying..." : "Apply Backfill"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm space-y-1">
              <p className="text-gray-300">
                Mode: <span className="font-medium">{result.dryRun ? "Dry run" : "Apply"}</span>
              </p>
              <p className="text-gray-400">Scanned users: {result.summary.scannedUsers}</p>
              <p className="text-green-400">Linked: {result.summary.linked}</p>
              <p className="text-gray-400">Skipped (no Discord): {result.summary.skippedNoDiscord}</p>
              <p className="text-gray-400">
                Skipped (already linked elsewhere): {result.summary.skippedAlreadyLinkedToOther}
              </p>
              <p className="text-yellow-400">Skipped (errors): {result.summary.skippedErrors}</p>
              {result.summary.errors.length > 0 && (
                <div className="mt-2 rounded border border-gray-800 bg-gray-950 p-2 max-h-48 overflow-auto">
                  {result.summary.errors.slice(0, 25).map((entry) => (
                    <p key={`${entry.clerkUserId}-${entry.reason}`} className="text-xs text-gray-500">
                      {entry.clerkUserId}: {entry.reason}
                    </p>
                  ))}
                  {result.summary.errors.length > 25 && (
                    <p className="text-xs text-gray-600 mt-1">
                      ...and {result.summary.errors.length - 25} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
