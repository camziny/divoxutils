"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const STORAGE_KEY = "divoxutils_support_prompt_v1";
const WINDOW_DAYS = 14;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;
const MAX_IMPRESSIONS_PER_WINDOW = 2;
const CLOSE_DELAY_SECONDS = 10;

type PromptHistory = {
  impressions: number[];
  lastDismissedAt: number | null;
  lastCtaAt: number | null;
};

type SupportPromptModalProps = {
  debug?: boolean;
  ignorePathRules?: boolean;
};

function defaultHistory(): PromptHistory {
  return {
    impressions: [],
    lastDismissedAt: null,
    lastCtaAt: null,
  };
}

function readHistory(): PromptHistory {
  if (typeof window === "undefined") return defaultHistory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHistory();
    const parsed = JSON.parse(raw) as Partial<PromptHistory>;
    return {
      impressions: Array.isArray(parsed.impressions)
        ? parsed.impressions.filter((value) => typeof value === "number" && Number.isFinite(value))
        : [],
      lastDismissedAt:
        typeof parsed.lastDismissedAt === "number" && Number.isFinite(parsed.lastDismissedAt)
          ? parsed.lastDismissedAt
          : null,
      lastCtaAt:
        typeof parsed.lastCtaAt === "number" && Number.isFinite(parsed.lastCtaAt)
          ? parsed.lastCtaAt
          : null,
    };
  } catch {
    return defaultHistory();
  }
}

function writeHistory(history: PromptHistory) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function getWindowedImpressions(history: PromptHistory, now: number) {
  const threshold = now - WINDOW_MS;
  return history.impressions.filter((timestamp) => timestamp >= threshold);
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString();
}

function isExcludedPath(pathname: string | null) {
  if (!pathname) return true;
  if (pathname === "/") return true;
  if (pathname === "/contribute") return true;
  if (pathname === "/billing") return true;
  if (pathname === "/support-modal-test") return true;
  if (pathname.startsWith("/sign-in")) return true;
  if (pathname.startsWith("/sign-up")) return true;
  return false;
}

export default function SupportPromptModal({
  debug = false,
  ignorePathRules = false,
}: SupportPromptModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const didInitialize = useRef(false);
  const lastPathname = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CLOSE_DELAY_SECONDS);
  const [history, setHistory] = useState<PromptHistory>(defaultHistory());

  const now = Date.now();
  const windowedImpressions = useMemo(() => getWindowedImpressions(history, now), [history, now]);
  const remainingInWindow = Math.max(0, MAX_IMPRESSIONS_PER_WINDOW - windowedImpressions.length);
  const nextEligibleAt =
    windowedImpressions.length >= MAX_IMPRESSIONS_PER_WINDOW
      ? new Date(windowedImpressions[0] + WINDOW_MS).toLocaleString()
      : "Now";
  const isPathEligible = ignorePathRules || !isExcludedPath(pathname);

  const openPrompt = (force = false) => {
    const timestamp = Date.now();
    const current = readHistory();
    const cleaned = getWindowedImpressions(current, timestamp);
    if (!force && cleaned.length >= MAX_IMPRESSIONS_PER_WINDOW) {
      setHistory({ ...current, impressions: cleaned });
      return false;
    }
    const lastSeen = cleaned[cleaned.length - 1];
    const deduped = lastSeen && timestamp - lastSeen < 4000 ? cleaned : [...cleaned, timestamp];
    const updated: PromptHistory = {
      ...current,
      impressions: deduped,
    };
    writeHistory(updated);
    setHistory(updated);
    setIsOpen(true);
    setCanClose(false);
    setSecondsLeft(CLOSE_DELAY_SECONDS);
    return true;
  };

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    const current = readHistory();
    const normalized: PromptHistory = {
      ...current,
      impressions: getWindowedImpressions(current, Date.now()),
    };
    writeHistory(normalized);
    setHistory(normalized);
  }, []);

  useEffect(() => {
    if (!didInitialize.current) return;
    if (!pathname) return;
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (!isPathEligible) return;
    openPrompt(false);
  }, [pathname, isPathEligible]);

  useEffect(() => {
    if (isPathEligible) return;
    if (isOpen) {
      setIsOpen(false);
      setCanClose(false);
      setSecondsLeft(CLOSE_DELAY_SECONDS);
    }
  }, [isPathEligible, isOpen]);

  useEffect(() => {
    if (!isOpen || canClose) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, canClose]);

  const dismiss = () => {
    const current = readHistory();
    const updated: PromptHistory = {
      ...current,
      impressions: getWindowedImpressions(current, Date.now()),
      lastDismissedAt: Date.now(),
    };
    writeHistory(updated);
    setHistory(updated);
    setIsOpen(false);
  };

  const viewSupportOptions = () => {
    const current = readHistory();
    const updated: PromptHistory = {
      ...current,
      impressions: getWindowedImpressions(current, Date.now()),
      lastCtaAt: Date.now(),
    };
    writeHistory(updated);
    setHistory(updated);
    setIsOpen(false);
    router.push("/contribute");
  };

  const resetHistory = () => {
    const fresh = defaultHistory();
    writeHistory(fresh);
    setHistory(fresh);
    setIsOpen(false);
    setCanClose(false);
    setSecondsLeft(CLOSE_DELAY_SECONDS);
  };

  return (
    <>
      {debug && (
        <section className="rounded-lg border border-gray-800 bg-gray-800/20 p-4 space-y-3 text-sm">
          <p className="text-gray-300">
            In-window impressions:{" "}
            <span className="text-white font-medium">
              {windowedImpressions.length} / {MAX_IMPRESSIONS_PER_WINDOW}
            </span>
          </p>
          <p className="text-gray-300">
            Remaining displays now: <span className="text-white font-medium">{remainingInWindow}</span>
          </p>
          <p className="text-gray-300">
            Next eligible display: <span className="text-white font-medium">{nextEligibleAt}</span>
          </p>
          <p className="text-gray-300">
            Last dismissed: <span className="text-white font-medium">{formatTimestamp(history.lastDismissedAt)}</span>
          </p>
          <p className="text-gray-300">
            Last clicked support CTA:{" "}
            <span className="text-white font-medium">{formatTimestamp(history.lastCtaAt)}</span>
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => openPrompt(false)}
              className="rounded-md bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
            >
              Trigger with cadence rules
            </button>
            <button
              type="button"
              onClick={() => openPrompt(true)}
              className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Force preview modal
            </button>
            <button
              type="button"
              onClick={resetHistory}
              className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Reset test history
            </button>
          </div>
        </section>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (canClose) dismiss();
            return;
          }
          setIsOpen(true);
        }}
      >
        <DialogContent className="max-w-md border-gray-800 bg-gray-900 p-0 gap-0 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <DialogTitle className="text-base font-semibold text-white">
              Help keep divoxutils running
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              This project is free to use but has real infrastructure costs every month. Here is where your
              support goes.
            </DialogDescription>
          </div>

          <div className="mx-5 rounded-lg border border-gray-800 bg-gray-800/20 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Breakdown</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-3">
                <span>Cloud hosting and runtime infrastructure</span>
                <span className="text-gray-200 shrink-0">$20 / mo</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Database and storage</span>
                <span className="text-gray-200 shrink-0">$30 / mo</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Discord bot hosting</span>
                <span className="text-gray-200 shrink-0">$5 / mo</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Domain name registration</span>
                <span className="text-gray-200 shrink-0">$1.25 / mo</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Cloud compute and usage overages (variable)</span>
                <span className="text-gray-200 shrink-0">$0 – $5 / mo</span>
              </div>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total costs</p>
              <div className="flex items-center justify-between text-gray-300">
                <span>Monthly</span>
                <span className="text-white font-medium">~$57 – $62</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>Annual</span>
                <span className="text-white font-medium">~$675 – $735</span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4 pb-5 space-y-4">
            <p className="text-sm text-gray-400">
              Monthly support tiers are <span className="text-gray-200">$1</span>,{" "}
              <span className="text-gray-200">$3</span>, and <span className="text-gray-200">$5</span>. Every bit
              helps.
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={!canClose}
                onClick={dismiss}
                className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {canClose ? "Not now" : `Not now (${secondsLeft}s)`}
              </button>
              <button
                type="button"
                onClick={viewSupportOptions}
                className="rounded-md bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
              >
                View support options
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
