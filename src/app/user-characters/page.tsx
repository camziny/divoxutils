import React from "react";
import dynamic from "next/dynamic";
import CharacterSearchAndAdd from "../components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs";
import { Suspense } from "react";
import Loading from "../loading";
import ShareProfileButton from "../components/ShareProfileButton";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

const CharacterListOptimized = dynamic(
  () => import("../components/CharacterListOptimized"),
  {
    loading: () => {
      const CharacterListSkeleton = require("../components/CharacterListSkeleton").default;
      return <CharacterListSkeleton />;
    },
  }
);

export const metadata = {
  title: "My Characters - divoxutils",
};

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;
  const response = await fetch(apiUrl, {
    next: {
      revalidate: 0, 
      tags: [`user-characters-${userId}`],
    },
  });
  if (!response.ok) {
    console.error(
      `Error fetching characters: ${response.status} ${response.statusText}`
    );
    throw new Error(
      `Fetch response error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

interface UserCharactersPageProps {
  searchParams?: Promise<any>;
}

const UserCharactersPage = async ({ searchParams }: UserCharactersPageProps) => {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const characters = await fetchCharactersForUser(userId);

  const user = await currentUser();

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <ShareProfileButton username={user?.username ?? ''} />
        </div>
        
        <div className="p-4 md:p-8 lg:p-12">
          <div className="max-w-screen-lg mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                My Characters
              </h1>
            </div>
            <CharacterSearchAndAdd />
            <div className="mt-6">
              <Suspense fallback={<Loading />}>
                <CharacterListOptimized
                  characters={characters}
                  searchParams={resolvedSearchParams}
                  showDelete={true}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCharactersPage;
