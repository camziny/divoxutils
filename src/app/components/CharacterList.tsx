import { auth } from "@clerk/nextjs";
import CharacterTile from "./CharacterTile";
import CharacterTableHeader from "./CharacterTableHeader";
import AggregateStatistics from "./CharacterListSummary";
import MobileCharacterTile from "./MobileCharacterTile";
import { TableContainer, Paper, Table, TableBody } from "@mui/material";
import { CharacterData, Realm } from "@/utils/character";

type CharacterTileProps = {
  webId: string;
  characterDetails: CharacterData;
  initialCharacter: {
    id: number;
    userId: string;
    webId: string;
  };
  realmPointsLastWeek: number;
  totalRealmPoints: number;
  currentUserId?: string | null;
  ownerId: string;
  formattedHeraldRealmPoints: any;
  heraldBountyPoints: any;
  heraldTotalKills: any;
  heraldTotalDeaths: any;
};

async function fetchCharactersForUser(
  userId: number
): Promise<CharacterData[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${userId}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Fetch response error: ${response.status} - ${JSON.stringify(data)}`
      );
    }
    const characterDetails = data;
    return characterDetails;
  } catch (error) {
    console.error("Error fetching characters:", error);
    throw error;
  }
}

const realmOrder: Record<Realm, number> = {
  Albion: 1,
  Hibernia: 2,
  Midgard: 3,
};

const sortCharacters = (characters: CharacterData[]) => {
  return characters.sort((a, b) => {
    if (!(a.realm in realmOrder) || !(b.realm in realmOrder)) {
      console.error("Invalid realm data:", a.realm, b.realm);
      return 0;
    }
    if (realmOrder[a.realm] < realmOrder[b.realm]) return -1;
    if (realmOrder[a.realm] > realmOrder[b.realm]) return 1;
    if (
      typeof a.heraldRealmPoints !== "number" ||
      typeof b.heraldRealmPoints !== "number"
    ) {
      console.error(
        "Invalid realm points data:",
        a.heraldRealmPoints,
        b.heraldRealmPoints
      );
      return 0;
    }
    return b.heraldRealmPoints - a.heraldRealmPoints;
  });
};

export default async function CharacterList({
  userId,
  search,
}: {
  userId: any;
  search: string;
}) {
  const { userId: clerkUserId } = auth();
  const effectiveUserId = userId || clerkUserId;
  let detailedCharacters: any = [];
  let userError = null;

  try {
    if (effectiveUserId) {
      const fetchedCharacters = await fetchCharactersForUser(effectiveUserId);
      detailedCharacters = sortCharacters(fetchedCharacters);
    } else {
      userError = (
        <p>User is not authenticated. Please log in to view characters.</p>
      );
    }
  } catch (error) {
    console.error("Error fetching characters:", error);
    userError = <p>An error occurred while fetching characters.</p>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
      {userError}

      <div className="hidden sm:block character-table-container">
        <TableContainer component={Paper}>
          <Table stickyHeader style={{ tableLayout: "fixed" }}>
            <thead>
              <CharacterTableHeader />
            </thead>
          </Table>
          <div
            style={{
              height: "1000px",
              overflowY: "auto",
              backgroundColor: "#111827",
            }}
          >
            <Table style={{ tableLayout: "fixed" }}>
              <TableBody>
                {detailedCharacters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-4 text-white bg-gray-900"
                    >
                      <div>
                        <strong>No characters available</strong>
                      </div>
                    </td>
                  </tr>
                ) : (
                  detailedCharacters.map((character: CharacterData) => (
                    <CharacterTile
                      key={character.id}
                      webId={character.webId}
                      character={character}
                      characterDetails={character}
                      formattedHeraldRealmPoints={
                        character.formattedHeraldRealmPoints
                      }
                      initialCharacter={{
                        id: character.id,
                        userId: userId,
                        webId: character.webId,
                      }}
                      heraldBountyPoints={character.heraldBountyPoints}
                      heraldTotalKills={character.heraldTotalKills}
                      heraldTotalDeaths={character.heraldTotalDeaths}
                      realmPointsLastWeek={character.realmPointsLastWeek}
                      totalRealmPoints={character.totalRealmPoints}
                      currentUserId={userId}
                      ownerId={character.clerkUserId}
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
          detailedCharacters.map((character: CharacterData) => (
            <MobileCharacterTile
              key={character.id}
              webId={character.webId}
              character={character}
              characterDetails={character}
              formattedHeraldRealmPoints={character.formattedHeraldRealmPoints}
              initialCharacter={{
                id: character.id,
                userId: userId,
                webId: character.webId,
              }}
              heraldBountyPoints={character.heraldBountyPoints}
              heraldTotalKills={character.heraldTotalKills}
              heraldTotalDeaths={character.heraldTotalDeaths}
              realmPointsLastWeek={character.realmPointsLastWeek}
              totalRealmPoints={character.totalRealmPoints}
              currentUserId={userId}
              ownerId={character.clerkUserId}
            />
          ))
        )}
      </div>
      <AggregateStatistics characters={detailedCharacters} />
    </div>
  );
}
