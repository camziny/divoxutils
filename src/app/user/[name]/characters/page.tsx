import React from "react";
import dynamic from "next/dynamic";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Metadata, ResolvingMetadata } from "next";
import ShareProfileButton from "@/app/components/ShareProfileButton";
import SortOptions from "@/app/components/SortOptions";
import { PrismaClient } from "@prisma/client";

const CharacterListOptimized = dynamic(
  () => import("@/app/components/CharacterListOptimized"),
  {
    loading: () => {
      const CharacterListSkeleton = require("@/app/components/CharacterListSkeleton").default;
      return <CharacterListSkeleton />;
    },
  }
);

interface CharactersPageParams {
  name: string;
  clerkUserId: string;
}

interface CharactersPageProps {
  params: CharactersPageParams;
  searchParams: { [key: string]: string | string[] };
}

const prisma = new PrismaClient();

export async function generateMetadata(
  { params }: { params: CharactersPageParams },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await prisma.user.findMany({
    where: {
      name: params.name,
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
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;

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

const CharactersPage: React.FC<CharactersPageProps> = async ({
  params,
  searchParams = {},
}) => {
  const userData = await prisma.user.findMany({
    where: {
      name: params.name,
    },
  });

  const user = userData[0];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-gray-200 mb-2">User Not Found</h1>
        <p className="text-gray-400">The user &ldquo;{params.name}&rdquo; does not exist.</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {user.name}
              </h1>
            </div>
            <PageReload />
            <Suspense fallback={<Loading />}>
              <CharacterListOptimized
                characters={characters}
                searchParams={searchParams}
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
