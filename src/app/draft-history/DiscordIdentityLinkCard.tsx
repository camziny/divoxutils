"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { hasConnectedDiscordAccount } from "@/lib/identity/discord";

type LinkState = "idle" | "linking" | "success" | "error";
type ClaimState = "idle" | "submitting" | "success" | "error";

export default function DiscordIdentityLinkCard() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [manualDiscordId, setManualDiscordId] = useState("");
  const [message, setMessage] = useState("");

  const hasDiscord = useMemo(
    () =>
      hasConnectedDiscordAccount(
        (user?.externalAccounts as Array<{ provider?: string; providerId?: string }>) ?? []
      ),
    [user?.externalAccounts]
  );

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
      setMessage("Discord linked. Your draft stats can now be associated with your account.");
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
      setMessage("Claim submitted. An admin will review your Discord link request.");
    } catch {
      setClaimState("error");
      setMessage("Unable to submit claim.");
    }
  }

  if (!isSignedIn) {
    return (
      <div className="mb-5 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
        <p className="text-xs text-gray-400">
          Sign in to link your Discord account and track your draft history.
        </p>
        <Link
          href="/sign-in"
          className="mt-2 inline-flex rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          Link your Discord account to match draft participation with your profile stats.
        </p>
        <button
          type="button"
          disabled={linkState === "linking" || !hasDiscord}
          onClick={onLink}
          className="rounded-md border border-indigo-600/60 bg-indigo-600/10 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linkState === "linking" ? "Linking..." : "Link Discord"}
        </button>
      </div>

      {!hasDiscord && (
        <div className="mt-3 rounded-md border border-amber-700/40 bg-amber-900/10 px-3 py-2">
          <p className="text-xs text-amber-300/90">
            No Discord account is connected to your Clerk profile. Connect Discord in your auth
            profile, or submit a manual claim with your Discord user ID.
          </p>
          <form onSubmit={onClaim} className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualDiscordId}
              onChange={(e) => setManualDiscordId(e.target.value)}
              placeholder="Discord user ID"
              className="h-8 w-44 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-200 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={claimState === "submitting" || manualDiscordId.trim().length === 0}
              className="h-8 rounded-md border border-gray-700 px-3 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {claimState === "submitting" ? "Submitting..." : "Submit claim"}
            </button>
          </form>
        </div>
      )}

      {message && (
        <p
          className={`mt-2 text-xs ${
            linkState === "error" || claimState === "error" ? "text-red-400" : "text-green-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
