import React from "react";
import dynamic from "next/dynamic";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Metadata, ResolvingMetadata } from "next";
import ShareProfileButton from "@/app/components/ShareProfileButton";
import SupporterBadge from "@/app/components/SupporterBadge";
import { headers } from "next/headers";
import prisma from "../../../../../prisma/prismaClient";

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

export async function generateMetadata(
  { params }: { params: Promise<any> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const userData = await prisma.user.findMany({
    where: {
      name: resolvedParams.name,
    },
  });

  const user = userData[0];
  
  if (!user) {
    return {
      title: "User Not Found - divoxutils",
    };
  }

  return {
    title: `${user.name} - divoxutils`,
  };
}

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${getApiBaseUrl()}/api/userCharactersByUserId/${userId}`;

  const response = await fetch(apiUrl, {
    next: {
      revalidate: 60,
      tags: [`other-characters-${userId}`],
    },
  });

  if (!response.ok) {
    console.error(
      `Fetch response error: ${response.status} ${response.statusText}`
    );
    throw new Error(
      `Fetch response error: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();

  return data;
}

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

const CharactersPage = async ({ params, searchParams }: CharactersPageProps) => {
  const resolvedParams = (await (params ?? Promise.resolve({}))) as { name?: string };
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const userData = await prisma.user.findMany({
    where: {
      name: resolvedParams.name as string,
    },
  });

  const user = userData[0];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-gray-200 mb-2">User Not Found</h1>
        <p className="text-gray-400">The user &ldquo;{resolvedParams.name}&rdquo; does not exist.</p>
      </div>
    );
  }

  const clerkUserId = user.clerkUserId;

  let characters = [];
  try {
    characters = await fetchCharactersForUser(clerkUserId);
  } catch (error) {
    console.error("Error fetching characters:", error);
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <ShareProfileButton username={user?.name ?? ''} />
        </div>
        
        <div className="p-4 md:p-8 lg:p-12">
          <div className="max-w-screen-lg mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white inline-flex items-center justify-center gap-2">
                {user.name}
                {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} size="md" />}
              </h1>
            </div>
            <PageReload />
            <Suspense fallback={<Loading />}>
              <CharacterListOptimized
                characters={characters}
                searchParams={resolvedSearchParams}
                showDelete={false}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharactersPage;
