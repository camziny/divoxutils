import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { getLiveDraftRows } from "@/server/draftLive";
import LiveDraftsAutoRefresh from "./LiveDraftsAutoRefresh";

export const revalidate = 15;

export const metadata = {
  title: "Live Drafts - divoxutils",
};

const STATUS_LABEL: Record<string, string> = {
  setup: "Setup",
  coin_flip: "Coin Flip",
  realm_pick: "Realm Pick",
  banning: "Banning",
  drafting: "Drafting",
  complete: "Game Pending",
};

export default async function LiveDraftsPage() {
  const rows = await getLiveDraftRows();

  return (
    <>
      <LiveDraftsAutoRefresh />
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-100">Live Drafts</h1>
        <p className="mt-1 text-[13px] text-gray-500">
          {rows.length > 0
            ? `${rows.length} active draft${rows.length !== 1 ? "s" : ""}`
            : "Live drafts will show here when available"}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
          No live drafts currently.
        </div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => (
            <Link
              key={row.shortId}
              href={row.href}
              className="block rounded-lg border border-gray-800 px-4 py-3 hover:bg-gray-800/20 transition-colors duration-100"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-gray-200 truncate flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <InlineAvatar
                      name={row.team1CaptainName}
                      avatarUrl={row.team1CaptainAvatarUrl}
                      size={18}
                    />
                    <span className="font-medium truncate">{row.team1CaptainName}</span>
                  </span>
                  <span className="text-gray-600 mx-1.5">vs</span>
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <InlineAvatar
                      name={row.team2CaptainName}
                      avatarUrl={row.team2CaptainAvatarUrl}
                      size={18}
                    />
                    <span className="font-medium truncate">{row.team2CaptainName}</span>
                  </span>
                </p>
                <span className="inline-flex items-center rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-100 flex-shrink-0">
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                {row.discordGuildName ? (
                  <span className="truncate max-w-[210px] sm:max-w-[320px]">{row.discordGuildName}</span>
                ) : (
                  <span>Unknown server</span>
                )}
                <span className="text-gray-700 select-none">&middot;</span>
                <span>{new Date(row.createdAtMs).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function InlineAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl?: string;
  size: number;
}) {
  const style = { width: size, height: size };
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className="rounded-full bg-gray-800/80 text-gray-400 inline-flex items-center justify-center"
      style={style}
    >
      <User className="w-[65%] h-[65%]" />
    </span>
  );
}
