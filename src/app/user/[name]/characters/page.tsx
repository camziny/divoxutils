import React from "react";
import OtherCharacterList from "@/app/components/OtherCharacterList";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";
import type { Metadata, ResolvingMetadata } from "next";
import ShareProfileButton from "@/app/components/ShareProfileButton";

interface CharactersPageParams {
  name: string;
  clerkUserId: string;
}

export async function generateMetadata(
  { params }: { params: CharactersPageParams },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { name } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users?name=${name}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const userData = await res.json();

  const user = userData[0];

  return {
    title: `${user.name} - divoxutils`,
  };
}

export default async function CharactersPage({
  params,
}: {
  params: CharactersPageParams;
}) {
  const { name } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users?name=${name}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const userData = await res.json();

  const user = userData[0];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-3xl font-bold text-indigo-400 mb-4 text-center flex items-center gap-2 justify-center">
            {user.name}
            <ShareProfileButton username={user.name} />
          </h1>
          <PageReload />
          <Suspense fallback={<Loading />}>
            <OtherCharacterList userId={user.clerkUserId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
