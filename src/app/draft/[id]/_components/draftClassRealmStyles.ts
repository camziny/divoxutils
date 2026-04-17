import {
  REALMS,
  classesByRealm,
  toCanonicalDraftClassName,
} from "../../_lib/constants";

export const REALM_CLASS_COLORS: Record<
  string,
  {
    pill: string;
    button: string;
    selected: string;
    banned: string;
  }
> = {
  Albion: {
    pill: "bg-red-900/20 text-red-300 border-red-700/40",
    button:
      "border-red-700/50 bg-red-900/15 text-red-200 hover:bg-red-800/25 hover:border-red-500/60",
    selected: "border-red-400/70 bg-red-700/30 text-red-100",
    banned: "border-red-900/40 bg-red-950/30 text-red-300/50",
  },
  Midgard: {
    pill: "bg-blue-900/20 text-blue-300 border-blue-700/40",
    button:
      "border-blue-700/50 bg-blue-900/15 text-blue-200 hover:bg-blue-800/25 hover:border-blue-500/60",
    selected: "border-blue-400/70 bg-blue-700/30 text-blue-100",
    banned: "border-blue-900/40 bg-blue-950/30 text-blue-300/50",
  },
  Hibernia: {
    pill: "bg-green-900/20 text-green-300 border-green-700/40",
    button:
      "border-green-700/50 bg-green-900/15 text-green-200 hover:bg-green-800/25 hover:border-green-500/60",
    selected: "border-green-400/70 bg-green-700/30 text-green-100",
    banned: "border-green-900/40 bg-green-950/30 text-green-300/50",
  },
};

export function realmsForClass(className: string) {
  return REALMS.filter((realm) => (classesByRealm[realm] || []).includes(className));
}

export function getRealmChipBackground(className: string) {
  const realmTagMatch = className.match(/\((Alb|Mid|Hib)\)$/);
  if (realmTagMatch) {
    const taggedRealm =
      realmTagMatch[1] === "Alb"
        ? "Albion"
        : realmTagMatch[1] === "Mid"
          ? "Midgard"
          : "Hibernia";
    return taggedRealm === "Albion"
      ? "bg-red-900/20"
      : taggedRealm === "Midgard"
        ? "bg-blue-900/20"
        : "bg-green-900/20";
  }

  const canonical = toCanonicalDraftClassName(className.replace(/\s*\((Alb|Mid|Hib)\)$/, ""));
  const realms = realmsForClass(canonical);
  if (realms.length !== 1) return "bg-gray-700/30";
  return realms[0] === "Albion"
    ? "bg-red-900/20"
    : realms[0] === "Midgard"
      ? "bg-blue-900/20"
      : "bg-green-900/20";
}
