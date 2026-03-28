export function isSupportPromptExcludedPath(pathname: string | null) {
  if (!pathname) return true;
  if (pathname === "/") return true;
  if (pathname === "/support-modal-test") return true;
  if (pathname.startsWith("/contribute")) return true;
  if (pathname.startsWith("/billing")) return true;
  if (pathname.startsWith("/sign-in")) return true;
  if (pathname.startsWith("/sign-up")) return true;
  return false;
}

export function isSupportPromptEligible({
  isLoaded,
  isSupporter,
  isAdmin,
  isKnownExempt,
  ignorePathRules,
  pathname,
}: {
  isLoaded: boolean;
  isSupporter: boolean;
  isAdmin: boolean;
  isKnownExempt: boolean;
  ignorePathRules: boolean;
  pathname: string | null;
}) {
  if (!isLoaded) return false;
  if (isSupporter) return false;
  if (isAdmin) return false;
  if (isKnownExempt) return false;
  if (ignorePathRules) return true;
  return !isSupportPromptExcludedPath(pathname);
}

export function isKnownExemptActive(knownExemptUntil: number | null, now: number) {
  if (typeof knownExemptUntil !== "number" || !Number.isFinite(knownExemptUntil)) {
    return false;
  }
  return knownExemptUntil > now;
}

export function shouldClearKnownExempt({
  isSignedIn,
  isSupporter,
  isAdmin,
}: {
  isSignedIn: boolean;
  isSupporter: boolean;
  isAdmin: boolean;
}) {
  return isSignedIn && !isSupporter && !isAdmin;
}
