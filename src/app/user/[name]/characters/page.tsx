import React from "react";
import dynamic from "next/dynamic";
import { PageReload } from "@/app/user/_components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Metadata, ResolvingMetadata } from "next";
import SupporterBadge from "@/components/support/SupporterBadge";
import ShareProfileButton from "@/app/user/_components/ShareProfileButton";
import DraftProfileButton from "@/app/user/_components/DraftProfileButton";
import prisma from "../../../../../prisma/prismaClient";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import { getCurrentUserCharacterListLayoutPreference } from "@/server/characterListLayoutPreference";
import {
  getPublicCharactersForUser,
  getPublicUserProfileByName,
} from "@/server/publicUserCharacters";

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
      title: "User Not Found - divoxutils",
      description: "This profile could not be found on divoxutils.",
    };
  }

  const displayName = user.name?.trim() || "Player";
  const pathSegment =
    typeof resolvedParams.name === "string" ? resolvedParams.name : displayName;
  const profileUrl = `https://divoxutils.com/user/${encodeURIComponent(pathSegment)}/characters`;

  return {
    title: `${displayName}'s characters - divoxutils`,
    description: `See ${displayName}'s characters on divoxutils.`,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${displayName}'s characters`,
      description: `See ${displayName}'s characters on divoxutils.`,
      url: profileUrl,
      type: "website",
      images: ["/wh-big.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName}'s characters`,
      description: `See ${displayName}'s characters on divoxutils.`,
      images: ["/wh-big.png"],
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

  const [characters, identityLink, preferredDesktopLayout] = await Promise.all([
    getPublicCharactersForUser(clerkUserId),
    prisma.userIdentityLink.findFirst({
      where: {
        clerkUserId,
        provider: "discord",
        status: "linked",
      },
      select: { id: true },
    }),
    getCurrentUserCharacterListLayoutPreference(),
  ]);

  const draftProfileHref = identityLink
    ? getLeaderboardProfileHref(clerkUserId, user.name ?? undefined)
    : undefined;

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <div className="relative flex items-center justify-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white inline-flex items-center gap-2">
              {user.name}
              {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} size="md" />}
            </h1>
            <div className="absolute right-0 flex items-center gap-1.5">
              {draftProfileHref && <DraftProfileButton href={draftProfileHref} />}
              <ShareProfileButton username={user.name ?? ''} />
            </div>
          </div>
          <PageReload />
          <Suspense fallback={<Loading />}>
            <CharacterListOptimized
              characters={characters}
              searchParams={resolvedSearchParams}
              showDelete={false}
              preferredDesktopLayout={preferredDesktopLayout}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CharactersPage;
