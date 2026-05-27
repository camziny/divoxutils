import type { Metadata } from "next";
import { allClasses } from "@/app/draft/_lib/constants";
import { getClassDraftStats } from "@/server/draftStats";
import ClassLeaderboardClient from "./_components/ClassLeaderboardClient";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Class draft leaderboard",
  description:
    "Dark Age of Camelot (DAoC) class-specific draft stats and leaderboards on divoxutils.",
  path: "/draft-history/class-leaderboard",
  openGraphTitle: "DAoC class draft leaderboard — divoxutils",
});

export default async function ClassLeaderboardPage({
  searchParams,
}: {
  searchParams?: { class?: string };
}) {
  const requestedClass = searchParams?.class;
  const className = allClasses.includes(requestedClass ?? "")
    ? (requestedClass as string)
    : allClasses[0];
  const rows = await getClassDraftStats(className, {});

  return (
    <ClassLeaderboardClient
      className={className}
      classOptions={allClasses}
      rows={rows}
    />
  );
}
