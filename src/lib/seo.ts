import type { Metadata } from "next";

export const SITE_URL = "https://divoxutils.com";
export const SITE_NAME = "divoxutils";
export const OG_IMAGE_PATH = "/opengraph-image";

export const DEFAULT_TITLE = "divoxutils — Dark Age of Camelot (DAoC) tools";
export const DEFAULT_DESCRIPTION =
  "divoxutils is a Dark Age of Camelot (DAoC) community hub for character tracking, leaderboards, realm rank reference, draft history, Discord bot commands, and Ghost UI.";

export const NOINDEX_METADATA: Pick<Metadata, "robots"> = {
  robots: {
    index: false,
    follow: false,
  },
};

export function buildAbsoluteUrl(path: string): string {
  if (path === "/" || path === "") {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  openGraphTitle?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  openGraphTitle,
}: PageMetadataInput): Metadata {
  const canonical = buildAbsoluteUrl(path);
  const ogTitle = openGraphTitle ?? title;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "website",
      images: [OG_IMAGE_PATH],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/leaderboards",
  "/search",
  "/realm-ranks",
  "/draft-history",
  "/draft-history/leaderboard",
  "/draft-history/live",
  "/draft-history/class-leaderboard",
  "/discord",
  "/ui",
  "/contribute",
  "/privacy",
  "/terms",
  "/support",
  "/tools",
  "/draft",
] as const;
