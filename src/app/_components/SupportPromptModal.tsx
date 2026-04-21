"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { track } from "@vercel/analytics/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SupporterBadge from "@/components/support/SupporterBadge";
import { getWindowedImpressions, resolveCadence } from "@/components/support/supportPromptCadence";
import { SUPPORT_PROMPT_TIER_PLANS } from "@/components/support/supportPromptTierPlans";
import PaymentProviderToggle, {
  type PaymentProvider,
} from "@/components/support/PaymentProviderToggle";
import {
  isKnownExemptActive,
  shouldClearKnownExempt,
  isSupportPromptEligible,
} from "@/components/support/supportPromptRules";

const CLOSE_DELAY_SECONDS = 10;
const KNOWN_EXEMPT_UNTIL_KEY = "divoxutils_support_prompt_known_exempt_until_v1";
const KNOWN_EXEMPT_PERSIST_UNTIL = Number.MAX_SAFE_INTEGER;
const CLOSE_LOCK_SUFFIX = "_close_lock_until_v1";
const PENDING_TIER_KEY = "divoxutils_support_prompt_pending_tier_v1";
const PENDING_PROVIDER_KEY = "divoxutils_support_prompt_pending_provider_v1";
const LOCK_ALLOWED_PATH_PREFIXES = ["/contribute", "/billing", "/sign-in", "/sign-up"];

type PromptHistory = {
  impressions: number[];
  lastDismissedAt: number | null;
  lastCtaAt: number | null;
};

type SupportPromptModalProps = {
  debug?: boolean;
  ignorePathRules?: boolean;
  isSupporter?: boolean;
  isAdmin?: boolean;
  paypalEnabled?: boolean;
};

function defaultHistory(): PromptHistory {
  return {
    impressions: [],
    lastDismissedAt: null,
    lastCtaAt: null,
  };
}

function readHistory(storageKey: string): PromptHistory {
  if (typeof window === "undefined") return defaultHistory();
  try {
    const raw = window.localStorage.getItem(storageKey);
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

function writeHistory(storageKey: string, history: PromptHistory) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(history));
}

function readKnownExemptUntil() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KNOWN_EXEMPT_UNTIL_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeKnownExemptUntil(timestamp: number | null) {
  if (typeof window === "undefined") return;
  try {
    if (!timestamp) {
      window.localStorage.removeItem(KNOWN_EXEMPT_UNTIL_KEY);
      return;
    }
    window.localStorage.setItem(KNOWN_EXEMPT_UNTIL_KEY, String(timestamp));
  } catch {
    return;
  }
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString();
}

function isLockAllowedPath(pathname: string | null) {
  if (!pathname) return false;
  return LOCK_ALLOWED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getCloseLockStorageKey(storageKey: string) {
  return `${storageKey}${CLOSE_LOCK_SUFFIX}`;
}

function readCloseLockUntil(storageKey: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getCloseLockStorageKey(storageKey));
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCloseLockUntil(storageKey: string, timestamp: number | null) {
  if (typeof window === "undefined") return;
  try {
    const key = getCloseLockStorageKey(storageKey);
    if (!timestamp) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, String(timestamp));
  } catch {
    return;
  }
}

function readPendingTier() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_TIER_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (parsed !== 1 && parsed !== 2 && parsed !== 3) return null;
    return parsed as 1 | 2 | 3;
  } catch {
    return null;
  }
}

function writePendingTier(tier: 1 | 2 | 3 | null) {
  if (typeof window === "undefined") return;
  try {
    if (!tier) {
      window.localStorage.removeItem(PENDING_TIER_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_TIER_KEY, String(tier));
  } catch {
    return;
  }
}

function readPendingProvider(): PaymentProvider {
  if (typeof window === "undefined") return "stripe";
  try {
    const raw = window.localStorage.getItem(PENDING_PROVIDER_KEY);
    if (raw === "paypal") return "paypal";
    return "stripe";
  } catch {
    return "stripe";
  }
}

function writePendingProvider(provider: PaymentProvider | null) {
  if (typeof window === "undefined") return;
  try {
    if (!provider) {
      window.localStorage.removeItem(PENDING_PROVIDER_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_PROVIDER_KEY, provider);
  } catch {
    return;
  }
}

export default function SupportPromptModal({
  debug = false,
  ignorePathRules = false,
  isSupporter = false,
  isAdmin = false,
  paypalEnabled = false,
}: SupportPromptModalProps) {
  const checkoutErrorId = useId();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const initializedStorageKey = useRef<string | null>(null);
  const lastPathname = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CLOSE_DELAY_SECONDS);
  const [closeLockUntil, setCloseLockUntil] = useState<number | null>(null);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [history, setHistory] = useState<PromptHistory>(defaultHistory());
  const [isKnownExempt, setIsKnownExempt] = useState(false);
  const cadence = useMemo(() => resolveCadence(Boolean(isSignedIn)), [isSignedIn]);
  const authState = isSignedIn ? "signed_in" : "signed_out";

  const trackSupportPromptEvent = useCallback(
    (name: string, properties?: Record<string, string | number | boolean | null>) => {
      track(name, {
        path: pathname ?? "unknown",
        auth_state: authState,
        ...properties,
      });
    },
    [pathname, authState]
  );

  const now = Date.now();
  const windowedImpressions = useMemo(
    () => getWindowedImpressions(history.impressions, now, cadence.windowMs),
    [history, now, cadence.windowMs]
  );
  const lastSeenInWindow = windowedImpressions[windowedImpressions.length - 1] ?? null;
  const remainingInWindow = Math.max(0, cadence.maxImpressions - windowedImpressions.length);
  const nextEligibleByWindow =
    windowedImpressions.length >= cadence.maxImpressions ? windowedImpressions[0] + cadence.windowMs : now;
  const nextEligibleByInterval = lastSeenInWindow ? lastSeenInWindow + cadence.minIntervalMs : now;
  const nextEligibleTimestamp = Math.max(nextEligibleByWindow, nextEligibleByInterval);
  const nextEligibleAt =
    nextEligibleTimestamp <= now ? "Now" : new Date(nextEligibleTimestamp).toLocaleString();
  const isLockActive = typeof closeLockUntil === "number" && closeLockUntil > now;
  const isCurrentPathLockAllowed = isLockAllowedPath(pathname);
  const isPathEligible = isSupportPromptEligible({
    isLoaded,
    isSupporter,
    isAdmin,
    isKnownExempt,
    ignorePathRules,
    pathname,
  });

  const startCheckout = useCallback(
    async (
      tier: 1 | 2 | 3,
      source: "modal" | "sign_in_return",
      selectedProvider: PaymentProvider
    ) => {
      setCheckoutError(null);
      setLoadingTier(tier);
      const current = readHistory(cadence.storageKey);
      const updated: PromptHistory = {
        ...current,
        impressions: getWindowedImpressions(current.impressions, Date.now(), cadence.windowMs),
        lastCtaAt: Date.now(),
      };
      writeHistory(cadence.storageKey, updated);
      setHistory(updated);
      trackSupportPromptEvent("support_modal_clicked_subscribe", {
        source,
        tier,
        provider: selectedProvider,
      });
      try {
        const endpoint =
          selectedProvider === "paypal"
            ? "/api/billing/create-paypal-subscription"
            : "/api/billing/create-checkout-session";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.url) {
          throw new Error(payload?.error ?? "Unable to start checkout.");
        }
        window.location.assign(payload.url);
        return true;
      } catch (err) {
        setLoadingTier(null);
        setCheckoutError(err instanceof Error ? err.message : "Unable to start checkout.");
        return false;
      }
    },
    [cadence.storageKey, cadence.windowMs, trackSupportPromptEvent]
  );

  const openPrompt = useCallback(
    (force = false) => {
      const timestamp = Date.now();
      const current = readHistory(cadence.storageKey);
      const cleaned = getWindowedImpressions(current.impressions, timestamp, cadence.windowMs);
      const lastSeen = cleaned[cleaned.length - 1];
      if (!force && lastSeen && timestamp - lastSeen < cadence.minIntervalMs) {
        setHistory({ ...current, impressions: cleaned });
        return false;
      }
      if (!force && cleaned.length >= cadence.maxImpressions) {
        setHistory({ ...current, impressions: cleaned });
        return false;
      }
      const deduped = lastSeen && timestamp - lastSeen < 4000 ? cleaned : [...cleaned, timestamp];
      const updated: PromptHistory = {
        ...current,
        impressions: deduped,
      };
      writeHistory(cadence.storageKey, updated);
      setHistory(updated);
      const lockUntil = timestamp + CLOSE_DELAY_SECONDS * 1000;
      writeCloseLockUntil(cadence.storageKey, lockUntil);
      setCloseLockUntil(lockUntil);
      setIsOpen(true);
      setCanClose(false);
      setSecondsLeft(Math.max(1, Math.ceil((lockUntil - timestamp) / 1000)));
      trackSupportPromptEvent("support_modal_seen", {
        trigger: force ? "forced" : "cadence",
      });
      return true;
    },
    [
      cadence.maxImpressions,
      cadence.minIntervalMs,
      cadence.storageKey,
      cadence.windowMs,
      trackSupportPromptEvent,
    ]
  );

  useEffect(() => {
    if (!isLoaded) return;
    const nowTimestamp = Date.now();
    const knownExemptUntil = readKnownExemptUntil();
    if (isKnownExemptActive(knownExemptUntil, nowTimestamp)) {
      setIsKnownExempt(true);
      return;
    }
    writeKnownExemptUntil(null);
    setIsKnownExempt(false);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSupporter || isAdmin) {
      writeKnownExemptUntil(KNOWN_EXEMPT_PERSIST_UNTIL);
      setIsKnownExempt(true);
      return;
    }
    if (
      shouldClearKnownExempt({
        isSignedIn: Boolean(isSignedIn),
        isSupporter,
        isAdmin,
      })
    ) {
      writeKnownExemptUntil(null);
      setIsKnownExempt(false);
      return;
    }
    const knownExemptUntil = readKnownExemptUntil();
    if (!isKnownExemptActive(knownExemptUntil, Date.now())) {
      writeKnownExemptUntil(null);
      setIsKnownExempt(false);
    }
  }, [isLoaded, isSignedIn, isSupporter, isAdmin]);

  useEffect(() => {
    if (!isLoaded) return;
    if (initializedStorageKey.current === cadence.storageKey) return;
    initializedStorageKey.current = cadence.storageKey;
    lastPathname.current = null;
    const current = readHistory(cadence.storageKey);
    const normalized: PromptHistory = {
      ...current,
      impressions: getWindowedImpressions(current.impressions, Date.now(), cadence.windowMs),
    };
    writeHistory(cadence.storageKey, normalized);
    setHistory(normalized);
    const persistedCloseLockUntil = readCloseLockUntil(cadence.storageKey);
    setCloseLockUntil(persistedCloseLockUntil);
  }, [isLoaded, cadence.storageKey, cadence.windowMs]);

  useEffect(() => {
    if (!isLoaded) return;
    if (initializedStorageKey.current !== cadence.storageKey) return;
    if (!pathname) return;
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    const nowTimestamp = Date.now();
    const persistedCloseLockUntil = readCloseLockUntil(cadence.storageKey);
    const isCloseLocked =
      typeof persistedCloseLockUntil === "number" && Number.isFinite(persistedCloseLockUntil)
        ? persistedCloseLockUntil > nowTimestamp
        : false;
    if (isCloseLocked) {
      const lockedUntil = persistedCloseLockUntil as number;
      if (isLockAllowedPath(pathname)) {
        setIsOpen(false);
        setCanClose(false);
        setSecondsLeft(Math.max(1, Math.ceil((lockedUntil - nowTimestamp) / 1000)));
        setCloseLockUntil(lockedUntil);
        return;
      }
      setCloseLockUntil(lockedUntil);
      setIsOpen(true);
      setCanClose(false);
      setSecondsLeft(Math.max(1, Math.ceil((lockedUntil - nowTimestamp) / 1000)));
      return;
    }
    if (!isPathEligible) return;
    openPrompt(false);
  }, [isLoaded, pathname, isPathEligible, cadence.storageKey, openPrompt]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (isSupporter || isAdmin) {
      writePendingTier(null);
      writePendingProvider(null);
      return;
    }
    if (loadingTier !== null) return;
    const pendingTier = readPendingTier();
    if (!pendingTier) return;
    const pendingProvider = readPendingProvider();
    const resolvedProvider: PaymentProvider =
      pendingProvider === "paypal" && paypalEnabled ? "paypal" : "stripe";
    writePendingTier(null);
    writePendingProvider(null);
    void startCheckout(pendingTier, "sign_in_return", resolvedProvider);
  }, [
    isLoaded,
    isSignedIn,
    isSupporter,
    isAdmin,
    loadingTier,
    paypalEnabled,
    startCheckout,
  ]);

  useEffect(() => {
    if (isPathEligible) return;
    if (isLockActive && !isCurrentPathLockAllowed) return;
    if (isOpen) {
      setIsOpen(false);
      setCanClose(false);
      setSecondsLeft(CLOSE_DELAY_SECONDS);
    }
  }, [isPathEligible, isOpen, isLockActive, isCurrentPathLockAllowed]);

  useEffect(() => {
    if (!isOpen) return;
    if (!closeLockUntil) {
      setCanClose(true);
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remainingMs = closeLockUntil - Date.now();
      if (remainingMs <= 0) {
        setCanClose(true);
        setSecondsLeft(0);
        writeCloseLockUntil(cadence.storageKey, null);
        setCloseLockUntil(null);
        return true;
      }
      setCanClose(false);
      setSecondsLeft(Math.max(1, Math.ceil(remainingMs / 1000)));
      return false;
    };
    if (tick()) return;
    const interval = window.setInterval(() => {
      if (tick()) {
        window.clearInterval(interval);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, closeLockUntil, cadence.storageKey]);

  const dismiss = () => {
    const current = readHistory(cadence.storageKey);
    const updated: PromptHistory = {
      ...current,
      impressions: getWindowedImpressions(current.impressions, Date.now(), cadence.windowMs),
      lastDismissedAt: Date.now(),
    };
    writeHistory(cadence.storageKey, updated);
    setHistory(updated);
    writeCloseLockUntil(cadence.storageKey, null);
    setCloseLockUntil(null);
    setIsOpen(false);
    trackSupportPromptEvent("support_modal_dismissed");
  };

  const subscribeNow = async (tier: 1 | 2 | 3) => {
    setCheckoutError(null);
    const selectedProvider: PaymentProvider = paypalEnabled ? provider : "stripe";
    if (!isSignedIn) {
      writePendingTier(tier);
      writePendingProvider(selectedProvider);
      const redirectPath = pathname || "/";
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
      return;
    }
    await startCheckout(tier, "modal", selectedProvider);
  };

  const resetHistory = () => {
    const fresh = defaultHistory();
    writeHistory(cadence.storageKey, fresh);
    writeCloseLockUntil(cadence.storageKey, null);
    writePendingTier(null);
    writePendingProvider(null);
    setHistory(fresh);
    setIsOpen(false);
    setCanClose(false);
    setSecondsLeft(CLOSE_DELAY_SECONDS);
    setCloseLockUntil(null);
  };

  return (
    <>
      {debug && (
        <section className="rounded-lg border border-gray-800 bg-gray-800/20 p-4 space-y-3 text-sm">
          <p className="text-gray-300">
            In-window impressions:{" "}
            <span className="text-white font-medium">
              {windowedImpressions.length} / {cadence.maxImpressions}
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
            else setIsOpen(true);
            return;
          }
          setIsOpen(true);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg border-gray-800 bg-gray-900 p-0 gap-0 overflow-hidden max-h-[90dvh] overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <DialogTitle className="text-base font-semibold text-white">
              Help keep divoxutils running
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              This project is free to use but has real infrastructure costs every month. Here is where your
              support goes.
            </DialogDescription>
          </div>

          <div className="mx-4 sm:mx-5 rounded-lg border border-gray-800 bg-gray-800/20 p-3 sm:p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cost Breakdown</h3>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 text-sm">
              <dt className="text-gray-300">Cloud hosting and runtime infrastructure</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$20 / mo</dd>
              <dt className="text-gray-300">Database and storage</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$30 / mo</dd>
              <dt className="text-gray-300">Automated QA and deployment safety</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$5 - $60+ / mo</dd>
              <dt className="text-gray-300">Discord bot hosting</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$5 / mo</dd>
              <dt className="text-gray-300">Domain name registration</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$1.25 / mo</dd>
              <dt className="text-gray-300">Cloud compute and usage overages (variable)</dt>
              <dd className="text-gray-200 tabular-nums text-right shrink-0">$0 - $5 / mo</dd>
            </dl>
            <div className="h-px bg-gray-800" />
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total costs</p>
              <div className="flex items-center justify-between text-gray-300">
                <span>Monthly estimate</span>
                <span className="text-white font-medium">~$61 - $121+</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>Annual estimate</span>
                <span className="text-white font-medium">~$730 - $1,450+</span>
              </div>
            </div>
          </div>

          {paypalEnabled && (
            <div className="mx-4 sm:mx-5 mt-3">
              <PaymentProviderToggle
                value={provider}
                onChange={setProvider}
                disabled={loadingTier !== null}
                size="sm"
              />
            </div>
          )}

          <div className="mx-4 sm:mx-5 mt-3 space-y-2">
            {SUPPORT_PROMPT_TIER_PLANS.map((plan) => (
              <button
                key={plan.tier}
                type="button"
                disabled={loadingTier !== null}
                onClick={() => subscribeNow(plan.tier)}
                aria-describedby={checkoutError ? checkoutErrorId : undefined}
                className={`w-full flex items-center gap-2.5 sm:gap-3 rounded-md border px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors disabled:opacity-50 ${
                  plan.tier === 3
                    ? "border-indigo-500/20 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12]"
                    : "border-gray-800 bg-gray-800/20 hover:bg-gray-800/40"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40`}
              >
                <SupporterBadge tier={plan.tier} size="md" showTooltip={false} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white">{plan.label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                </div>
                <span className="shrink-0 rounded-md bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300">
                  {loadingTier === plan.tier ? "Loading…" : "Subscribe"}
                </span>
              </button>
            ))}
          </div>

          {checkoutError && (
            <div className="mx-4 sm:mx-5 mt-2">
              <p
                id={checkoutErrorId}
                role="alert"
                aria-live="assertive"
                className="rounded-md border border-red-900/60 bg-red-900/20 px-3 py-2 text-xs text-red-300"
              >
                {checkoutError}
              </p>
            </div>
          )}

          {!isSignedIn && (
            <div className="mx-4 sm:mx-5 mt-2">
              <button
                type="button"
                disabled={loadingTier !== null}
                onClick={() => {
                  const redirectPath = pathname || "/";
                  router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
                }}
                className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 rounded-sm"
              >
                Already supporting? Sign in
              </button>
            </div>
          )}

          <div className="px-4 sm:px-5 pt-3 pb-4 sm:pb-5 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Any active tier removes this reminder.
            </p>
            <button
              type="button"
              disabled={!canClose || loadingTier !== null}
              onClick={dismiss}
              className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              {canClose ? "Not now" : `Not now (${secondsLeft}s)`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
