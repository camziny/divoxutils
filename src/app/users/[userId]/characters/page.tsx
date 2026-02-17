import React from "react";
import dynamic from "next/dynamic";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
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

  const userData = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { name: true },
  });
  if (!userData) {
    throw new Error("Failed to fetch user");
  }

  const characters = await fetchCharactersForUser(userId);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-3xl font-bold text-indigo-400 mb-4 text-center">
            {userData.name}
          </h1>
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
  );
}
