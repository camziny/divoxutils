import { auth } from "@clerk/nextjs";
import CharacterTile from "./CharacterTile";
import CharacterTableHeader from "./CharacterTableHeader";
import AggregateStatistics from "./CharacterListSummary";
import MobileCharacterTile from "./MobileCharacterTile";
import { TableContainer, Paper, Table, TableBody } from "@mui/material";

type CharacterTileProps = {
  webId: string;
  initialCharacter: {
    id: number;
    userId: string;
    webId: string;
  };
  realmPointsLastWeek: number;
  currentUserId?: string | null;
  ownerId: string;
};

interface FetchedCharacter {
  character: {
    id: number;
    webId: string;
    name: string;
  };
  userId: string;
}

type RealmType = 1 | 2 | 3;

async function fetchCharactersForUser(userId: number) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Fetch response error: ${JSON.stringify(data)}`);
    }
    if (data.userCharacters && Array.isArray(data.userCharacters)) {
      return data.userCharacters;
    } else {
      throw new Error(
        "Invalid data structure: Expected 'userCharacters' array"
      );
    }
  } catch (error) {
    console.error("Error in fetchCharactersForUser:", error);
    return [];
  }
}

async function fetchCharacterData(webId: string) {
  if (webId === "Jcedk2Qasok") {
    return null;
  }

  const apiUrl = `https://api.camelotherald.com/character/info/${webId}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for character with webId: ${webId}`
      );
    }
    return data;
  } catch (error) {
    console.error(
      `Error fetching data for character with webId: ${webId}:`,
      error
    );
    return null;
  }
}

async function searchUsersByName(name: any) {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/searchUsers?name=${name}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (!response.ok) {
    console.error("Search response error:", data);
    return [];
  }

  return data;
}

async function getDetailedCharacters(userId: any, search: any) {
  let characters = await fetchCharactersForUser(userId);
  if (search) {
    characters = characters.filter((char: any) =>
      char.character.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const detailedCharacters = (
    await Promise.all(
      characters.map(async (char: any) => {
        const detailedData = await fetchCharacterData(char.character.webId);
        if (!detailedData) return null;
        return { ...char, detailedCharacter: detailedData };
      })
    )
  ).filter((char) => char !== null);

  return detailedCharacters;
}

const sortOrder: Record<RealmType, number> = {
  1: 1,
  3: 2,
  2: 3,
};

export default async function CharacterList({
  userId,
  search,
}: {
  userId: string;
  search: string;
}) {
  const { userId: clerkUserId } = auth();
  const effectiveUserId = userId || clerkUserId;

  let detailedCharacters = [];
  let userError = null;

  if (effectiveUserId) {
    detailedCharacters = await getDetailedCharacters(effectiveUserId, search);
    detailedCharacters.sort((a, b) => {
      if (!a.detailedCharacter || !b.detailedCharacter) return 0;
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
    userError = (
      <p>User is not authenticated. Please log in to view characters.</p>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
      <div className="hidden sm:block">
        <TableContainer component={Paper}>
          <Table stickyHeader style={{ tableLayout: "fixed" }}>
            <thead>
              <CharacterTableHeader />
            </thead>
          </Table>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Table style={{ tableLayout: "fixed" }}>
              <TableBody>
                {detailedCharacters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-4 text-white bg-gray-900"
                    >
                      <div>
                        <p>
                          <strong>No characters available</strong>
                        </p>
                        <p className="text-sm mt-2">
                          <i>Notice:</i> Some users may currently encounter
                          difficulties in viewing their characters after adding
                          them. I am actively working on resolving this issue
                          and will provide an update as soon as it&apos;s fixed!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  detailedCharacters.map((item) => (
                    <CharacterTile
                      key={item.character.id}
                      webId={item.character.webId}
                      initialCharacter={item}
                      realmPointsLastWeek={item.character.realmPointsLastWeek}
                      currentUserId={clerkUserId as string}
                      ownerId={item.user.clerkUserId}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      </div>
      <div className="sm:hidden overflow-auto max-h-[500px] w-full">
        {detailedCharacters.length === 0 ? (
          <div className="text-center py-4 text-white bg-gray-900">
            No characters available
          </div>
        ) : (
          detailedCharacters.map((item) => (
            <MobileCharacterTile
              key={item.character.id}
              webId={item.character.webId}
              initialCharacter={item}
              realmPointsLastWeek={item.detailedCharacter.realmPointsLastWeek}
              currentUserId={clerkUserId!}
              ownerId={item.user.clerkUserId}
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
