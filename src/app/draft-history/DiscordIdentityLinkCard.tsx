"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { hasConnectedDiscordAccount } from "@/lib/identity/discord";
import { FaDiscord } from "react-icons/fa";

type LinkState = "idle" | "linking" | "success" | "error";
type ClaimState = "idle" | "submitting" | "success" | "error";
type DbStatus =
  | { loading: true }
  | {
      loading: false;
      linked: true;
      providerUserId: string;
      hasAnyDraftRowsForLinkedId: boolean;
      possibleMismatch: boolean;
    }
  | { loading: false; linked: false; pendingClaim: boolean };

export default function DiscordIdentityLinkCard({
  draftDiscordUserId,
}: {
  draftDiscordUserId?: string;
}) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [message, setMessage] = useState("");
  const [dbStatus, setDbStatus] = useState<DbStatus>({ loading: true });
  const [autoLinkConflictDiscordUserId, setAutoLinkConflictDiscordUserId] =
    useState<string | null>(null);
  const [lastAutoLinkKey, setLastAutoLinkKey] = useState<string | null>(null);

  const hasDiscord = useMemo(
    () =>
      hasConnectedDiscordAccount(
        (user?.externalAccounts as Array<{ provider?: string; providerId?: string }>) ?? []
      ),
    [user?.externalAccounts]
  );

  const loadStatus = useCallback(async () => {
    if (!isSignedIn) {
      setDbStatus({ loading: false, linked: false, pendingClaim: false });
      return;
    }
    const res = await fetch("/api/identity/discord-status");
    const data = await res.json();
    if (data.linked) {
      const hasAnyDraftRowsForLinkedId =
        typeof data.hasAnyDraftRowsForLinkedId === "boolean"
          ? data.hasAnyDraftRowsForLinkedId
          : true;
      const possibleMismatch =
        typeof data.possibleMismatch === "boolean"
          ? data.possibleMismatch
          : !hasAnyDraftRowsForLinkedId;
      setDbStatus({
        loading: false,
        linked: true,
        providerUserId: data.providerUserId,
        hasAnyDraftRowsForLinkedId,
        possibleMismatch,
      });
      return;
    }
    setDbStatus({ loading: false, linked: false, pendingClaim: !!data.pendingClaim });
  }, [isSignedIn]);

  useEffect(() => {
    let cancelled = false;
    if (!isSignedIn) {
      setDbStatus({ loading: false, linked: false, pendingClaim: false });
      return;
    }
    setDbStatus({ loading: true });
    loadStatus().catch(() => {
      if (!cancelled) {
        setDbStatus({ loading: false, linked: false, pendingClaim: false });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, loadStatus]);

  useEffect(() => {
    if (
      !isSignedIn ||
      dbStatus.loading ||
      dbStatus.linked ||
      (!dbStatus.linked && dbStatus.pendingClaim)
    ) {
      return;
    }
    if (!draftDiscordUserId) {
      return;
    }
    const key = `${user?.id ?? "anonymous"}:${draftDiscordUserId}`;
    if (lastAutoLinkKey === key) {
      return;
    }
    setLastAutoLinkKey(key);
    setLinkState("linking");
    setMessage("");
    setAutoLinkConflictDiscordUserId(null);

    fetch("/api/identity/link-discord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserId: draftDiscordUserId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLinkState("error");
          if (res.status === 409) {
            setAutoLinkConflictDiscordUserId(draftDiscordUserId);
            setMessage(
              "This draft was created with a different Discord account. Submit a claim so an admin can review it."
            );
            return;
          }
          setMessage(data?.error ?? "Unable to link Discord right now.");
          return;
        }
        setLinkState("success");
        setMessage("Discord linked automatically for this draft.");
        await loadStatus();
      })
      .catch(() => {
        setLinkState("error");
        setMessage("Unable to link Discord right now.");
      });
  }, [
    dbStatus,
    draftDiscordUserId,
    isSignedIn,
    lastAutoLinkKey,
    loadStatus,
    user?.id,
  ]);

  async function onLink() {
    setLinkState("linking");
    setClaimState("idle");
    setMessage("");
    setAutoLinkConflictDiscordUserId(null);
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
      await loadStatus();
    } catch {
      setLinkState("error");
      setMessage("Unable to link Discord right now.");
    }
  }

  async function submitClaim(discordUserId: string) {
    setClaimState("submitting");
    setLinkState("idle");
    setMessage("");
    setAutoLinkConflictDiscordUserId(null);
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

  if (dbStatus.loading) return null;
  if (autoLinkConflictDiscordUserId) {
    return (
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-gray-100">
            Discord account mismatch
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          This signed-in account does not match the Discord ID used in this draft.
          Submit a claim so we can verify and link your history.
        </p>
        <button
          type="button"
          disabled={claimState === "submitting"}
          onClick={() => submitClaim(autoLinkConflictDiscordUserId)}
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {claimState === "submitting" ? "Submitting..." : "Submit claim"}
        </button>
        {message && (
          <p
            className={
              claimState === "error"
                ? "mt-3 text-xs text-red-400"
                : "mt-3 text-xs text-green-300"
            }
          >
            {message}
          </p>
        )}
      </div>
    );
  }


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

  if (!dbStatus.loading && dbStatus.linked && dbStatus.hasAnyDraftRowsForLinkedId) {
    return null;
  }

  if (!dbStatus.loading && dbStatus.linked && !dbStatus.hasAnyDraftRowsForLinkedId) {
    return (
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-gray-100">
            Discord linked, history not visible yet
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          {dbStatus.possibleMismatch
            ? "Your history is still missing. If you drafted with another Discord account, submit a claim so we can review it."
            : "Your history appears after your first verified draft."}
        </p>
        {dbStatus.possibleMismatch && (
          <button
            type="button"
            disabled={claimState === "submitting"}
            onClick={() => submitClaim(dbStatus.providerUserId)}
            className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {claimState === "submitting" ? "Submitting..." : "Submit claim"}
          </button>
        )}
        {!dbStatus.possibleMismatch && (
          <div className="mt-1">
            <p className="text-[11px] text-gray-500 mb-2">
              Already drafted?
            </p>
            <button
              type="button"
              disabled={claimState === "submitting"}
              onClick={() => submitClaim(dbStatus.providerUserId)}
              className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {claimState === "submitting" ? "Submitting..." : "Submit claim"}
            </button>
          </div>
        )}
        {message && (claimState === "error" || claimState === "success") && (
          <p className={claimState === "error" ? "mt-3 text-xs text-red-400" : "mt-3 text-xs text-green-300"}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (!dbStatus.loading && !dbStatus.linked && dbStatus.pendingClaim) {
    return (
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xs text-gray-300 font-medium">
            Your claim is pending admin review.
          </p>
        </div>
      </div>
    );
  }

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
        {hasDiscord
          ? "Even though you're signed in with Discord, we just need a quick one-click link to connect your draft stats."
          : draftDiscordUserId
            ? "We found your draft participant ID. Continue with Discord or link manually to sync history."
            : "Connect your Discord account to track your draft stats on the leaderboard."}
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
            No Discord account is connected to this login yet. Sign in with Discord to link automatically.
          </p>
          <Link
            href="/sign-in?redirect_url=/draft-history"
            className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            Continue with Discord
          </Link>
        </div>
      )}

      {message && (linkState === "error" || claimState === "error") && (
        <p className="mt-3 text-xs text-red-400">{message}</p>
      )}
    </div>
  );
}
