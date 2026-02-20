"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { hasConnectedDiscordAccount } from "@/lib/identity/discord";
import { FaDiscord } from "react-icons/fa";

type LinkState = "idle" | "linking" | "success" | "error";
type ClaimState = "idle" | "submitting" | "success" | "error";
type DbStatus =
  | { loading: true }
  | { loading: false; linked: true; providerUserId: string }
  | { loading: false; linked: false; pendingClaim: boolean };

export default function DiscordIdentityLinkCard() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [manualDiscordId, setManualDiscordId] = useState("");
  const [message, setMessage] = useState("");
  const [dbStatus, setDbStatus] = useState<DbStatus>({ loading: true });

  const hasDiscord = useMemo(
    () =>
      hasConnectedDiscordAccount(
        (user?.externalAccounts as Array<{ provider?: string; providerId?: string }>) ?? []
      ),
    [user?.externalAccounts]
  );

  useEffect(() => {
    if (!isSignedIn) {
      setDbStatus({ loading: false, linked: false, pendingClaim: false });
      return;
    }
    let cancelled = false;
    fetch("/api/identity/discord-status")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.linked) {
          setDbStatus({ loading: false, linked: true, providerUserId: data.providerUserId });
        } else {
          setDbStatus({ loading: false, linked: false, pendingClaim: !!data.pendingClaim });
        }
      })
      .catch(() => {
        if (!cancelled) setDbStatus({ loading: false, linked: false, pendingClaim: false });
      });
    return () => { cancelled = true; };
  }, [isSignedIn]);

  async function onLink() {
    setLinkState("linking");
    setClaimState("idle");
    setMessage("");
    try {
      const res = await fetch("/api/identity/link-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkState("error");
        setMessage(data?.error ?? "Unable to link Discord right now.");
        return;
      }
      setLinkState("success");
      setMessage("Discord linked. Your draft stats are now associated with your account.");
      setDbStatus({ loading: false, linked: true, providerUserId: data.providerUserId ?? "" });
    } catch {
      setLinkState("error");
      setMessage("Unable to link Discord right now.");
    }
  }

  async function onClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const discordUserId = manualDiscordId.trim();
    if (!discordUserId) return;
    setClaimState("submitting");
    setLinkState("idle");
    setMessage("");
    try {
      const res = await fetch("/api/identity/claim-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimState("error");
        setMessage(data?.error ?? "Unable to submit claim.");
        return;
      }
      setClaimState("success");
      setMessage("Claim submitted. An admin will review your request.");
      setDbStatus({ loading: false, linked: false, pendingClaim: true });
    } catch {
      setClaimState("error");
      setMessage("Unable to submit claim.");
    }
  }

  /* ── Loading ── */
  if (dbStatus.loading) return null;

  /* ── Not signed in ── */
  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-gray-100">
            Track your draft history
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          Sign in and link your Discord account to see your stats on the leaderboard.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  /* ── Already linked — nothing to show ── */
  if (!dbStatus.loading && dbStatus.linked) {
    return null;
  }

  /* ── Pending claim ── */
  if (!dbStatus.loading && !dbStatus.linked && dbStatus.pendingClaim) {
    return (
      <div className="rounded-lg border border-yellow-600/30 bg-yellow-950/15 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-yellow-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <p className="text-xs text-yellow-300 font-medium">
            Your claim is pending admin review.
          </p>
        </div>
      </div>
    );
  }

  /* ── Just-completed action ── */
  if (linkState === "success" || claimState === "success") {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-950/20 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-green-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-xs text-green-300 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  /* ── Default: prompt to link ── */
  return (
    <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 px-4 py-3">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
          <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <span className="text-xs font-semibold text-gray-100">
          Link your Discord
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        Connect your Discord account to track your draft stats on the leaderboard.
      </p>

      {hasDiscord ? (
        <button
          type="button"
          disabled={linkState === "linking"}
          onClick={onLink}
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {linkState === "linking" ? "Linking..." : "Link Discord"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500">
            No Discord connected to your profile. Enter your Discord user ID to submit a manual claim.
          </p>
          <form onSubmit={onClaim} className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualDiscordId}
              onChange={(e) => setManualDiscordId(e.target.value)}
              placeholder="Discord user ID"
              className="h-8 w-44 rounded-md border border-gray-700 bg-gray-900/60 px-2.5 text-xs text-gray-200 placeholder:text-gray-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={claimState === "submitting" || manualDiscordId.trim().length === 0}
              className="h-8 rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {claimState === "submitting" ? "Submitting..." : "Submit claim"}
            </button>
          </form>
        </div>
      )}

      {message && (linkState === "error" || claimState === "error") && (
        <p className="mt-3 text-xs text-red-400">{message}</p>
      )}
    </div>
  );
}
