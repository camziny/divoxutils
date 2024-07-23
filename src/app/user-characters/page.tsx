import { Suspense } from "react";
import CharacterList from "../components/CharacterList";
import CharacterSearchAndAdd from "../components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs";
import Loading from "../loading";
import ShareProfileButton from "../components/ShareProfileButton";
import SortOptions from "../components/SortOption";

export const metadata = {
  title: "My Characters - divoxutils",
};

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
            <div className="mb-4">
              <SortOptions />
            </div>
            <CharacterList userId={user.id} searchParams={searchParams} />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default CharacterPage;
