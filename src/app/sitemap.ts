import type { MetadataRoute } from "next";
import { getPublicUsers } from "@/server/users";
import { buildAbsoluteUrl, PUBLIC_SITEMAP_PATHS, SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: buildAbsoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "daily",
    priority: path === "/" ? 1 : path === "/about" || path === "/search" ? 0.9 : 0.8,
  }));

  let userEntries: MetadataRoute.Sitemap = [];
  try {
    const users = await getPublicUsers();
    userEntries = users
      .filter((user) => user.name?.trim())
      .slice(0, 5000)
      .map((user) => ({
        url: `${SITE_URL}/user/${encodeURIComponent(user.name)}/characters`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }));
  } catch {
    userEntries = [];
  }

  return [...staticEntries, ...userEntries];
}
