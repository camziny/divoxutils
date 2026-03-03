import { allClasses } from "@/app/draft/constants";
import { getClassDraftStats } from "@/server/draftStats";
import ClassLeaderboardClient from "./ClassLeaderboardClient";

export const revalidate = 60;

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
