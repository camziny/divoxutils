import Link from "next/link";
import { FaDiscord } from "react-icons/fa";

type PreviewState =
  | "signedOut"
  | "signedInHasDiscord"
  | "signedInNoDiscord"
  | "pendingClaim"
  | "linkedMatched"
  | "linkedNoDraftRowsMismatch"
  | "linkedNoDraftRowsWaiting";

const PREVIEW_OPTIONS: Array<{ id: PreviewState; label: string }> = [
  { id: "signedOut", label: "Signed out" },
  { id: "signedInHasDiscord", label: "Signed in + has Discord" },
  { id: "signedInNoDiscord", label: "Signed in + no Discord linked" },
  { id: "pendingClaim", label: "Pending claim" },
  { id: "linkedMatched", label: "Linked + matched draft rows" },
  {
    id: "linkedNoDraftRowsMismatch",
    label: "Linked + history missing (might be different account)",
  },
  {
    id: "linkedNoDraftRowsWaiting",
    label: "Linked + history missing (still waiting)",
  },
];

function LinkCardPreview({ state }: { state: PreviewState }) {
  if (state === "signedOut") {
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

  if (state === "pendingClaim") {
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

  if (state === "linkedMatched") {
    return (
      <div className="rounded-lg border border-emerald-600/30 bg-emerald-950/20 px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-emerald-600/20">
            <FaDiscord className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-emerald-200">
            Hidden in production
          </span>
        </div>
        <p className="text-xs text-emerald-300/90 leading-relaxed">
          When linked and matched to draft rows, the real card returns null and is not shown.
        </p>
      </div>
    );
  }

  if (state === "linkedNoDraftRowsMismatch") {
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
          Your history is still missing. If you drafted with another Discord account, submit a
          claim so we can review it.
        </p>
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          Submit claim
        </button>
      </div>
    );
  }

  if (state === "linkedNoDraftRowsWaiting") {
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
          Your history appears after your first verified draft.
        </p>
        <div className="mt-1">
          <p className="text-[11px] text-gray-500 mb-2">
            Already drafted?
          </p>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            Submit claim
          </button>
        </div>
      </div>
    );
  }

  if (state === "signedInHasDiscord") {
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
          Even though you&apos;re signed in with Discord, we just need a quick one-click link to
          connect your draft stats.
        </p>
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          Link Discord
        </button>
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
        No Discord account is connected to this login yet. Sign in with Discord to link
        automatically.
      </p>
      <div className="space-y-2">
        <a
          href="/sign-in?redirect_url=/draft-history"
          className="inline-flex items-center rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          Continue with Discord
        </a>
      </div>
    </div>
  );
}

function resolvePreviewState(
  rawState: string | string[] | undefined
): PreviewState {
  const normalized = Array.isArray(rawState) ? rawState[0] : rawState;
  const matched = PREVIEW_OPTIONS.find((option) => option.id === normalized);
  return matched?.id ?? "linkedNoDraftRowsMismatch";
}

export default function DraftHistoryLinkTestPage({
  searchParams,
}: {
  searchParams?: { state?: string | string[] };
}) {
  const previewState = resolvePreviewState(searchParams?.state);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-10">
      <section className="mx-auto w-full max-w-3xl px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
          Discord Link Card UI Preview
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Use this page to preview each visual state of the Discord linking card.
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
            Preview state
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PREVIEW_OPTIONS.map((option) => (
              <Link
                key={option.id}
                href={`/draft-history/link-test?state=${option.id}`}
                className={
                  previewState === option.id
                    ? "rounded-md border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-left text-xs font-medium text-indigo-200"
                    : "rounded-md border border-gray-800 bg-gray-900/70 px-3 py-2 text-left text-xs font-medium text-gray-400 hover:border-gray-700 hover:text-gray-300"
                }
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <LinkCardPreview state={previewState} />
        </div>
      </section>
    </div>
  );
}
