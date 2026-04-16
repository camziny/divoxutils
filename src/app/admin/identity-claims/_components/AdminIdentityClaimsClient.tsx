"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type PendingClaim = {
  id: number;
  clerkUserId: string;
  provider: string;
  providerUserId: string;
  draftId: string | null;
  status: string;
  createdAt: string;
};

export default function AdminIdentityClaimsClient() {
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClaimId, setActiveClaimId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/identity/pending-claims");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load claims.");
      }
      setClaims(Array.isArray(payload?.claims) ? payload.claims : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load claims.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const onModerate = useCallback(
    async (claimId: number, action: "approve" | "reject") => {
      setActiveClaimId(claimId);
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await fetch("/api/identity/moderate-claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId, action }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to update claim.");
        }
        setClaims((current) => current.filter((claim) => claim.id !== claimId));
        setSuccessMessage(`Claim #${claimId} ${action === "approve" ? "approved" : "rejected"}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update claim.";
        setError(message);
      } finally {
        setActiveClaimId(null);
      }
    },
    []
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Admin
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Identity Claims</h1>
            <p className="mt-1 text-xs text-gray-500">
              {loading ? "Loading..." : `${claims.length} pending`}
            </p>
          </div>
          <button
            onClick={loadClaims}
            className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md border border-gray-800 px-3 py-2 text-xs text-gray-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-gray-800 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : claims.length === 0 ? (
          <div className="rounded-md border border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No pending claims.</p>
          </div>
        ) : (
          <div className="rounded-md border border-gray-800 divide-y divide-gray-800">
            {claims.map((claim) => (
              <div key={claim.id} className="px-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-200">Claim #{claim.id}</span>
                      <span className="text-xs text-gray-600">pending</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-600">Clerk User </span>
                        <span className="font-mono text-gray-400">{claim.clerkUserId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Discord ID </span>
                        <span className="font-mono text-gray-400">{claim.providerUserId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Draft </span>
                        <span className="text-gray-400">{claim.draftId ?? "--"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted </span>
                        <span className="text-gray-400">{formatDate(claim.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onModerate(claim.id, "approve")}
                      disabled={activeClaimId === claim.id}
                      className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onModerate(claim.id, "reject")}
                      disabled={activeClaimId === claim.id}
                      className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
