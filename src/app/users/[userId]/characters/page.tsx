import React from "react";
import OtherCharacterList from "@/app/components/OtherCharacterList";
import { PageReload } from "@/app/components/PageReload";
import { Suspense } from "react";
import Loading from "@/app/loading";

interface CharactersPageParams {
  userId: string;
}

export default async function CharactersPage({
  params,
}: {
  params: CharactersPageParams;
}) {
  const userId = params.userId;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const userData = await res.json();

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-3xl font-bold text-indigo-400 mb-4 text-center">
          {userData.name}
        </h1>
        <PageReload />
        <Suspense fallback={<Loading />}>
          <OtherCharacterList userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
