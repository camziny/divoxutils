import { CharacterData, Realm } from "@/utils/character";

const realmOrder: Record<Realm, number> = {
  Albion: 1,
  Hibernia: 2,
  Midgard: 3,
};

export const sortCharacters = (
  characters: CharacterData[],
  sortOption: string
) => {
  switch (sortOption) {
    case "realm":
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

    case "rank-high-to-low":
      return characters.sort(
        (a, b) => b.heraldRealmPoints - a.heraldRealmPoints
      );

    case "rank-low-to-high":
      return characters.sort(
        (a, b) => a.heraldRealmPoints - b.heraldRealmPoints
      );
    default:
      return characters;
  }
};
