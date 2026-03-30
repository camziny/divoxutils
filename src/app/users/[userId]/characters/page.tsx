import React from "react";
import dynamic from "next/dynamic";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import prisma from "../../../../../prisma/prismaClient";
import { getLeaderboardProfileHref } from "@/lib/draftHistoryLeaderboardPath";
import DraftProfileButton from "@/app/components/DraftProfileButton";
import { getCurrentUserCharacterListLayoutPreference } from "@/server/characterListLayoutPreference";

const CharacterListOptimized = dynamic(
  () => import("@/app/components/CharacterListOptimized"),
  {
    loading: () => {
      const CharacterListSkeleton = require("@/app/components/CharacterListSkeleton").default;
      return <CharacterListSkeleton />;
    },
  }
);

interface CharactersPageProps {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;
  const response = await fetch(apiUrl, {
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(
      `Fetch response error: ${response.status} ${response.statusText}`
    );
    throw new Error(
      `Fetch response error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

export default async function CharactersPage({
  params,
  searchParams,
}: CharactersPageProps) {
  const resolvedParams = (await (params ?? Promise.resolve({}))) as { userId?: string };
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const userId = resolvedParams.userId as string;

  const [userData, identityLink, preferredDesktopLayout] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { name: true },
    }),
    prisma.userIdentityLink.findFirst({
      where: {
        clerkUserId: userId,
        provider: "discord",
        status: "linked",
      },
      select: { id: true },
    }),
    getCurrentUserCharacterListLayoutPreference(),
  ]);

  if (!userData) {
    throw new Error("Failed to fetch user");
  }

  const characters = await fetchCharactersForUser(userId);

  const draftProfileHref = identityLink
    ? getLeaderboardProfileHref(userId, userData.name ?? undefined)
    : undefined;

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <div className="relative flex items-center justify-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              {userData.name}
            </h1>
            {draftProfileHref && (
              <div className="absolute right-0">
                <DraftProfileButton href={draftProfileHref} />
              </div>
            )}
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
}
