import React from "react";
import CharacterList from "../components/CharacterList";
import CharacterSearchAndAdd from "../components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs";
import { Suspense } from "react";
import Loading from "../loading";
import ShareProfileButton from "../components/ShareProfileButton";

export const metadata = {
  title: "My Characters - divoxutils",
};

async function fetchCharactersForUser(userId: string) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;
  const response = await fetch(apiUrl, {
    cache: "no-store",
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

interface CharacterPageProps {
  searchParams: { [key: string]: string | string[] };
}

const CharacterPage: React.FC<CharacterPageProps> = async ({
  searchParams,
}) => {
  const user = await currentUser();
  if (user === null) {
    return <p>User is not logged in.</p>;
  }

  const characters = await fetchCharactersForUser(user.id);

  console.log("Fetching characters for user ID:", user.id);
  console.log("Characters fetched:", characters);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="flex flex-col items-center mt-8 space-y-4 w-full overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CharacterSearchAndAdd />
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-4 sm:mb-6 flex items-center gap-2">
          {user?.username}
          {user?.username && <ShareProfileButton username={user.username} />}
        </div>
        <Suspense fallback={<Loading />}>
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <CharacterList
              characters={characters}
              searchParams={searchParams}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default CharacterPage;
