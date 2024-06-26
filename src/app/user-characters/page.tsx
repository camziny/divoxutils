import { Suspense } from "react";
import CharacterList from "../components/CharacterList";
import CharacterSearchAndAdd from "../components/CharacterSearchAndAdd";
import { currentUser } from "@clerk/nextjs";
import Loading from "../loading";
import ShareProfileButton from "../components/ShareProfileButton";

export const metadata = {
  title: "My Characters - divoxutils",
};

const CharacterPage: React.FC = async () => {
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
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <CharacterList userId={user.id} search="" />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default CharacterPage;
