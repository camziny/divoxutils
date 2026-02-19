import PlayerDrilldownClient from "./PlayerDrilldownClient";

export const dynamic = "force-dynamic";

export default function PlayerDrilldownPage({
  params,
}: {
  params: { clerkUserId: string };
}) {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <PlayerDrilldownClient clerkUserId={params.clerkUserId} />
    </div>
  );
}
