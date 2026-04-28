import React from "react";
import dynamic from "next/dynamic";
import CharacterSearchAndAdd from "./_components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import Loading from "../loading";
import ShareProfileButton from "../user/_components/ShareProfileButton";
import DraftProfileButton from "../user/_components/DraftProfileButton";
import SupporterBadge from "@/components/support/SupporterBadge";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "../../../prisma/prismaClient";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import type { Metadata } from "next";
import { isCharacterListLayout } from "@/server/characterListLayoutPreference";
import { getLeaderboardData } from "@/server/leaderboard";

export const metadata: Metadata = {
  title: "My Characters - divoxutils",
  description:
    "Manage your Dark Age of Camelot characters on divoxutils.",
  alternates: {
    canonical: "https://divoxutils.com/user-characters",
  },
  openGraph: {
    title: "My Characters - divoxutils",
    description:
      "Manage your Dark Age of Camelot characters on divoxutils.",
    url: "https://divoxutils.com/user-characters",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Characters - divoxutils",
    description:
      "Manage your Dark Age of Camelot characters on divoxutils.",
    images: ["/wh-big.png"],
  },
};

const CharacterListOptimized = dynamic(
  () => import("@/app/_components/characters/CharacterListOptimized"),
  {
    loading: () => {
      const CharacterListSkeleton = require("@/app/user/_components/CharacterListSkeleton").default;
      return <CharacterListSkeleton />;
    },
  }
);

function getApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configuredBaseUrl && process.env.NODE_ENV === "production") {
    return configuredBaseUrl;
  }

  const requestHeaders = headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${getApiBaseUrl()}/api/userCharactersByUserId/${userId}`;
  try {
    const response = await fetch(apiUrl, {
      next: {
        revalidate: 0,
        tags: [`user-characters-${userId}`],
      },
    });
    if (response.status === 404) {
      return { characters: [], error: null as string | null };
    }
    if (!response.ok) {
      const message = `Error fetching characters: ${response.status} ${response.statusText}`;
      console.error(message);
      return { characters: [], error: message };
    }
    const characters = await response.json();
    return { characters, error: null as string | null };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Error fetching characters: ${error.message}`
        : "Error fetching characters: unknown error";
    console.error(message);
    return { characters: [], error: message };
  }
}

interface UserCharactersPageProps {
  searchParams?: Promise<any>;
}

const UserCharactersPage = async ({ searchParams }: UserCharactersPageProps) => {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  let userId: string | null = null;
  try {
    const user = await currentUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/user-characters");
  }

  const [charactersResult, dbUser, identityLink, initialLeaderboardData] = await Promise.all([
    fetchCharactersForUser(userId),
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { supporterTier: true, name: true, preferredCharacterListLayout: true },
    }),
    prisma.userIdentityLink.findFirst({
      where: { clerkUserId: userId, provider: "discord", status: "linked" },
      select: { id: true },
    }),
    getLeaderboardData(),
  ]);

  const supporterTier = dbUser?.supporterTier ?? 0;
  const shareUsername = dbUser?.name ?? "";
  const preferredDesktopLayout = isCharacterListLayout(dbUser?.preferredCharacterListLayout)
    ? dbUser.preferredCharacterListLayout
    : null;
  const characters = charactersResult.characters;
  const charactersError = charactersResult.error;
  const draftProfileHref = identityLink
    ? getLeaderboardProfileHref(userId, dbUser?.name ?? undefined)
    : undefined;

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-lg font-semibold text-white tracking-tight inline-flex items-center gap-2">
              My Characters
              {supporterTier > 0 && <SupporterBadge tier={supporterTier} size="md" />}
            </h1>
            <div className="flex items-center gap-1.5">
              {draftProfileHref && <DraftProfileButton href={draftProfileHref} />}
              <ShareProfileButton username={shareUsername} />
            </div>
          </div>
          <CharacterSearchAndAdd />
          {charactersError && (
            <div className="mt-4 rounded-md border border-yellow-900/60 bg-yellow-900/20 px-4 py-2 text-sm text-yellow-300">
              We could not load your character list right now. Please refresh and try again.
            </div>
          )}
          <div className="mt-6">
            <Suspense fallback={<Loading />}>
              <CharacterListOptimized
                key={userId}
                characters={characters}
                searchParams={resolvedSearchParams}
                showDelete={true}
                preferredDesktopLayout={preferredDesktopLayout}
                initialLeaderboardData={initialLeaderboardData}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCharactersPage;
