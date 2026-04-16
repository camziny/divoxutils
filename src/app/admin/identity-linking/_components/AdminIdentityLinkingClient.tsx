"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type BackfillResponse = {
  batch: {
    scannedUsers: number;
    linked: number;
    skippedNoDiscord: number;
    skippedMissingClerkUser: number;
    skippedAlreadyLinkedToOther: number;
    skippedErrors: number;
    errors: Array<{ clerkUserId: string; reason: string }>;
  };
  progress: {
    hasMore: boolean;
    nextCursor: number | null;
  };
};

type BackfillAggregate = {
  scannedUsers: number;
  linked: number;
  skippedNoDiscord: number;
  skippedMissingClerkUser: number;
  skippedAlreadyLinkedToOther: number;
  skippedErrors: number;
  errors: Array<{ clerkUserId: string; reason: string }>;
  batches: number;
};

export default function AdminIdentityLinkingClient() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackfillAggregate | null>(null);

  async function runBackfill() {
    setRunning(true);
    setError(null);
    try {
      const aggregate: BackfillAggregate = {
        scannedUsers: 0,
        linked: 0,
        skippedNoDiscord: 0,
        skippedMissingClerkUser: 0,
        skippedAlreadyLinkedToOther: 0,
        skippedErrors: 0,
        errors: [],
        batches: 0,
      };
      let cursor: number | null = null;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch("/api/admin/identity-linking/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(cursor ? { cursor } : {}),
          }),
        });
        const payload = (await response.json()) as BackfillResponse & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error ?? "Backfill request failed.");
        }
        aggregate.scannedUsers += payload.batch.scannedUsers;
        aggregate.linked += payload.batch.linked;
        aggregate.skippedNoDiscord += payload.batch.skippedNoDiscord;
        aggregate.skippedMissingClerkUser += payload.batch.skippedMissingClerkUser;
        aggregate.skippedAlreadyLinkedToOther += payload.batch.skippedAlreadyLinkedToOther;
        aggregate.skippedErrors += payload.batch.skippedErrors;
        aggregate.errors.push(...payload.batch.errors);
        aggregate.batches += 1;
        hasMore = payload.progress.hasMore;
        cursor = payload.progress.nextCursor;
      }

      setResult(aggregate);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Backfill request failed.");
    } finally {
      setRunning(false);
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

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-5 space-y-4">
          <div className="rounded-md border border-indigo-500/25 bg-indigo-950/15 px-4 py-3">
            <p className="text-xs text-indigo-200/90">
              Safe backfill links users only when a Clerk Discord account is present and
              not already linked to a different user.
            </p>
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <Button
              onClick={runBackfill}
              disabled={running}
              className="bg-indigo-600/25 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/35"
            >
              {running ? "Running..." : "Run Safe Backfill"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md border border-gray-800 bg-gray-950/60 px-4 py-4 text-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-gray-300">
                  Last run: <span className="font-medium">Safe Backfill</span>
                </p>
                <p className="text-xs text-gray-500">
                  Batches: {result.batches}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <StatTile label="Scanned" value={result.scannedUsers} />
                <StatTile label="Linked" value={result.linked} />
                <StatTile label="No Discord" value={result.skippedNoDiscord} />
                <StatTile
                  label="Missing Clerk User"
                  value={result.skippedMissingClerkUser}
                />
                <StatTile
                  label="Linked Elsewhere"
                  value={result.skippedAlreadyLinkedToOther}
                />
                <StatTile label="Errors" value={result.skippedErrors} />
              </div>

              {result.errors.length > 0 && (
                <details className="rounded border border-gray-800 bg-gray-900/70">
                  <summary className="cursor-pointer px-3 py-2 text-xs text-gray-400">
                    Show error details ({result.errors.length})
                  </summary>
                  <div className="border-t border-gray-800 px-3 py-2 max-h-52 overflow-auto space-y-1">
                    {result.errors.slice(0, 25).map((entry) => (
                      <p key={`${entry.clerkUserId}-${entry.reason}`} className="text-xs text-gray-500">
                        {entry.clerkUserId}: {entry.reason}
                      </p>
                    ))}
                    {result.errors.length > 25 && (
                      <p className="text-xs text-gray-600 pt-1">
                        ...and {result.errors.length - 25} more
                      </p>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-800 bg-gray-900/60 px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm text-gray-200 font-medium">{value}</p>
    </div>
  );
}
