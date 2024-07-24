import React from "react";
import OtherCharacterList from "@/app/components/OtherCharacterList";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";

interface CharactersPageParams {
  userId: string;
}

interface CharactersPageProps {
  params: CharactersPageParams;
  searchParams: { [key: string]: string | string[] };
}

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;
  const response = await fetch(apiUrl, {
    cache: "no-store",
  });
  if (!response.ok) {
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
  const userId = params.userId;

  const userRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`
  );
  if (!userRes.ok) {
    throw new Error(
      `Failed to fetch user: ${userRes.status} ${userRes.statusText}`
    );
  }
  const userData = await userRes.json();

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
            <OtherCharacterList
              userId={userId}
              characters={characters}
              searchParams={searchParams}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
