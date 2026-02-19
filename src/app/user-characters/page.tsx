import React from "react";
import dynamic from "next/dynamic";
import CharacterSearchAndAdd from "../components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs";
import { Suspense } from "react";
import Loading from "../loading";
import ShareProfileButton from "../components/ShareProfileButton";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
  const response = await fetch(apiUrl, {
    next: {
      revalidate: 0, 
      tags: [`user-characters-${userId}`],
    },
  });
  if (response.status === 404) {
    return [];
  }
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
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  const characters = await fetchCharactersForUser(userId);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              My Characters
            </h1>
            <ShareProfileButton username={user?.username ?? ''} />
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
  );
};

export default UserCharactersPage;
