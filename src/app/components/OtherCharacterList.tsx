import CharacterTile from "./CharacterTile";
import CharacterTableHeader from "./CharacterTableHeader";
import AggregateStatistics from "./CharacterListSummary";
import MobileCharacterTile from "./MobileCharacterTile";

type OtherCharacterListProps = {
  userId?: string;
};

async function fetchCharactersForUser(userId: number) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Fetch response error: ${JSON.stringify(data)}`);
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (data.userCharacters && Array.isArray(data.userCharacters)) {
      return data.userCharacters;
    } else {
      throw new Error(
        "Invalid data structure: Expected an array of user characters"
      );
    }
  } catch (error) {
    console.error("Error in fetchCharactersForUser:", error);
    return [];
  }
}

async function fetchCharacterData(webId?: string) {
  const apiUrl = `https://api.camelotherald.com/character/info/${webId}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for character with webId: ${webId}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching data for character with webId: ${webId}:`,
      error
    );
    return null;
  }
}

async function getDetailedCharacters(userId?: any) {
  const characters = await fetchCharactersForUser(userId);
  const detailedCharacters = await Promise.all(
    characters.map(async (char: any) => {
      const ownerId = char.userId;
      const detailedData = await fetchCharacterData(char.character.webId);
      return { ...char, detailedCharacter: detailedData, ownerId: ownerId };
    })
  );
  return detailedCharacters;
}

type RealmType = 1 | 2 | 3;

const sortOrder: Record<RealmType, number> = {
  1: 1,
  3: 2,
  2: 3,
};

export default async function OtherCharacterList({
  userId,
}: OtherCharacterListProps) {
  let detailedCharacters = [];

  if (userId) {
    detailedCharacters = await getDetailedCharacters(userId);
    detailedCharacters.sort((a, b) => {
      const realmA = a.detailedCharacter.realm as RealmType;
      const realmB = b.detailedCharacter.realm as RealmType;
      const realmPointsA =
        a.detailedCharacter.realm_war_stats?.current?.realm_points || 0;
      const realmPointsB =
        b.detailedCharacter.realm_war_stats?.current?.realm_points || 0;

      if (sortOrder[realmA] !== sortOrder[realmB]) {
        return sortOrder[realmA] - sortOrder[realmB];
      } else {
        return realmPointsB - realmPointsA;
      }
    });
  } else {
    return <p>User ID is not provided. Unable to fetch characters.</p>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
      <div className="hidden sm:block w-full overflow-x-auto p-0 border border-white rounded-lg">
        <table className="w-full bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <thead>
            <CharacterTableHeader />
          </thead>
          <tbody>
            {detailedCharacters.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-white">
                  No characters available for this user
                </td>
              </tr>
            ) : (
              detailedCharacters.map((item) => (
                <CharacterTile
                  key={item.character.id}
                  webId={item.character.webId}
                  initialCharacter={item}
                  currentUserId={userId.toString()}
                  ownerId={item.ownerId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden w-full">
        {detailedCharacters.length === 0 ? (
          <div className="text-center py-4 text-white">
            No characters available for this user
          </div>
        ) : (
          detailedCharacters.map((item) => (
            <MobileCharacterTile
              key={item.character.id}
              webId={item.character.webId}
              initialCharacter={item}
              currentUserId={userId.toString()}
              ownerId={item.ownerId}
            />
          ))
        )}
      </div>
      <AggregateStatistics
        characters={detailedCharacters}
        opponentRealms={["Midgard", "Hibernia", "Albion"]}
      />
    </div>
  );
}
