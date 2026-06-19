import { classesByRealm } from "@/app/draft/_lib/constants";

const CLASS_NAME_ALIASES: Record<string, string> = {
  armswoman: "Armsman",
  heroine: "Hero",
  sorceress: "Sorcerer",
  enchantress: "Enchanter",
  huntress: "Hunter",
};

const CLASS_TO_REALM: Record<string, string> = Object.fromEntries(
  Object.entries(classesByRealm).flatMap(([realm, classNames]) =>
    classNames
      .filter((className) => className !== "Mauler")
      .map((className) => [className, realm])
  )
);

export function getRealmForChampionClass(
  className: string | undefined
): string | null {
  const canonicalClassName = normalizeChampionClassName(className);
  if (!canonicalClassName || canonicalClassName === "Mauler") {
    return null;
  }

  return CLASS_TO_REALM[canonicalClassName] ?? null;
}

export function normalizeChampionClassName(className: string | undefined): string {
  const trimmed = (className ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const alias = CLASS_NAME_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export const YWAIN_CLUSTER_NAME = "Ywain";

export function getClassChampionClusterName(
  serverName: string | null | undefined
): string | null {
  if (!isYwainServer(serverName)) {
    return null;
  }

  return YWAIN_CLUSTER_NAME;
}

export function getClassChampionBucketKey(
  className: string,
  realm: string,
  clusterName: string = YWAIN_CLUSTER_NAME
): string {
  return `${clusterName}|${normalizeChampionClassName(className)}|${realm}`;
}

export function isYwainServer(serverName: string | null | undefined): boolean {
  if (!serverName) {
    return false;
  }

  return /^Ywain/i.test(serverName.trim());
}

export function isChampionRealm(realm: string | null | undefined): realm is string {
  return realm === "Albion" || realm === "Midgard" || realm === "Hibernia";
}

export function getClassChampionTooltip(
  canonicalClassName: string,
  realm: string
): string {
  if (canonicalClassName === "Mauler") {
    return `Top ${canonicalClassName} on ${YWAIN_CLUSTER_NAME} (${realm})`;
  }

  return `Top ${canonicalClassName} on ${YWAIN_CLUSTER_NAME}`;
}
