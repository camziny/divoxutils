import React from "react";
import dynamic from "next/dynamic";
import { EyeOff } from "lucide-react";
import { PageReload } from "@/app/user/_components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Metadata, ResolvingMetadata } from "next";
import SupporterBadge from "@/components/support/SupporterBadge";
import ShareProfileButton from "@/app/user/_components/ShareProfileButton";
import DraftProfileButton from "@/app/user/_components/DraftProfileButton";
import HiddenProfileIndicator from "@/app/user/_components/HiddenProfileIndicator";
import prisma from "../../../../../prisma/prismaClient";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import { getCurrentUserCharacterListLayoutPreference } from "@/server/characterListLayoutPreference";
import {
  getPublicCharactersForUser,
  getPublicUserProfileByName,
} from "@/server/publicUserCharacters";
import { getLeaderboardData } from "@/server/leaderboard";
import {
  getProfileViewerContext,
  isProfileHiddenForViewer,
} from "@/server/profileViewerContext";
import { NOINDEX_METADATA } from "@/lib/seo";

const CharacterListOptimized = dynamic(
  () => import("@/app/_components/characters/CharacterListOptimized"),
  {
    loading: () => {
      const CharacterListSkeleton = require("@/app/user/_components/CharacterListSkeleton").default;
      return <CharacterListSkeleton />;
    },
  }
);

interface CharactersPageProps {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}

export async function generateMetadata(
  { params }: { params: Promise<any> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const user = await getPublicUserProfileByName(resolvedParams.name);

  if (!user) {
    return {
      title: "User Not Found",
      description: "This profile could not be found on divoxutils.",
    };
  }

  const viewer = await getProfileViewerContext(user.clerkUserId);
  if (isProfileHiddenForViewer(user.hideProfile, viewer)) {
    return {
      title: "Profile Hidden",
      description: "This user has chosen to keep their character list private.",
      ...NOINDEX_METADATA,
    };
  }

  const displayName = user.name?.trim() || "Player";
  const pathSegment =
    typeof resolvedParams.name === "string" ? resolvedParams.name : displayName;
  const profileUrl = `https://divoxutils.com/user/${encodeURIComponent(pathSegment)}/characters`;
  const description = `${displayName}'s Dark Age of Camelot characters on divoxutils, with aggregate stats and recent activity.`;
  const title = `${displayName}'s characters`;

  return {
    title,
    description,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "profile",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

const CharactersPage = async ({ params, searchParams }: CharactersPageProps) => {
  const resolvedParams = (await (params ?? Promise.resolve({}))) as { name?: string };
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const user = await getPublicUserProfileByName(resolvedParams.name as string);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-gray-200 mb-2">User Not Found</h1>
        <p className="text-gray-400">The user &ldquo;{resolvedParams.name}&rdquo; does not exist.</p>
      </div>
    );
  }

  const clerkUserId = user.clerkUserId;

  const viewer = await getProfileViewerContext(clerkUserId);
  const isHiddenForViewer = isProfileHiddenForViewer(user.hideProfile, viewer);

  const [identityLink, preferredDesktopLayout, initialLeaderboardData, characters] =
    await Promise.all([
      prisma.userIdentityLink.findFirst({
        where: {
          clerkUserId,
          provider: "discord",
          status: "linked",
        },
        select: { id: true },
      }),
      getCurrentUserCharacterListLayoutPreference(),
      getLeaderboardData(),
      isHiddenForViewer ? Promise.resolve([]) : getPublicCharactersForUser(clerkUserId),
    ]);

  const draftProfileHref = identityLink
    ? getLeaderboardProfileHref(clerkUserId, user.name ?? undefined)
    : undefined;

  const header = (
    <div className="relative flex items-center justify-center mb-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-white inline-flex items-center gap-2">
        {user.name}
        {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} size="md" />}
      </h1>
      <div className="absolute right-0 flex items-center gap-1.5">
        {user.hideProfile && viewer.canViewHiddenProfile && (
          <HiddenProfileIndicator isOwner={viewer.isOwner} />
        )}
        {draftProfileHref && <DraftProfileButton href={draftProfileHref} />}
        <ShareProfileButton username={user.name ?? ''} />
      </div>
    </div>
  );

  if (isHiddenForViewer) {
    return (
      <div className="bg-gray-900 min-h-screen text-gray-300">
        <div className="p-4 md:p-8 lg:p-12">
          <div className="max-w-screen-lg mx-auto">
            {header}
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/80 mb-3">
                  <EyeOff size={16} strokeWidth={2} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-300 mb-1">
                  Character list hidden
                </p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  {user.name ?? "This user"} has chosen to keep their
                  character list private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          {header}
          <PageReload />
          <Suspense fallback={<Loading />}>
            <CharacterListOptimized
              key={clerkUserId}
              characters={characters}
              searchParams={resolvedSearchParams}
              showDelete={false}
              preferredDesktopLayout={preferredDesktopLayout}
              initialLeaderboardData={initialLeaderboardData}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CharactersPage;
