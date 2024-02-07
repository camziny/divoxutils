import React, { useState, useEffect, useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "../../utils/character";
import {
  GroupCharacterSelectorProps,
  Realm,
  characterClassesByRealm,
  characterClassesByClassType,
} from "@/utils/group";

const getRealmByClassName = (className: string): Realm => {
  for (const [realm, classes] of Object.entries(characterClassesByRealm)) {
    if (classes.includes(className)) {
      return realm as Realm;
    }
  }
  return "PvP";
};

const GroupCharacterSelector: React.FC<GroupCharacterSelectorProps> = ({
  clerkUserId,
  characters,
  selectedCharacterId,
  onCharacterSelect,
  selectedRealm,
  sortOption,
  classTypeFilters,
}) => {
  const isSelectedRealmPlaceholder = (
    realm: Realm | string
  ): realm is string => {
    return realm === "Select Realm";
  };

  const [selectedCharacterDisplay, setSelectedCharacterDisplay] =
    useState<string>("Select a Character");

  const effectiveRealm = isSelectedRealmPlaceholder(selectedRealm)
    ? "PvP"
    : selectedRealm;

  const filteredCharacters = useMemo(() => {
    return characters.filter((characterObj) => {
      const isRealmMatch =
        effectiveRealm === "PvP" ||
        getRealmByClassName(characterObj.character.className) ===
          effectiveRealm;
      if (classTypeFilters.length === 0) return isRealmMatch;
      const isClassTypeMatch = classTypeFilters.some((filter) =>
        characterClassesByClassType[filter].includes(
          characterObj.character.className
        )
      );
      return isRealmMatch && isClassTypeMatch;
    });
  }, [characters, effectiveRealm, classTypeFilters]);

  const sortedCharacters = useMemo(() => {
    return [...filteredCharacters].sort((a, b) => {
      switch (sortOption) {
        case "Class Name":
          if (a.character.className < b.character.className) return -1;
          if (a.character.className > b.character.className) return 1;
          return a.character.characterName.localeCompare(
            b.character.characterName
          );
        case "RR High to Low":
          return b.character.totalRealmPoints - a.character.totalRealmPoints;
        case "RR Low to High":
          return a.character.totalRealmPoints - b.character.totalRealmPoints;
        default:
          return 0;
      }
    });
  }, [filteredCharacters, sortOption]);

  const selectedCharacter = characters.find(
    (char) => char.character.id === selectedCharacterId
  )?.character;

  const formattedRank = selectedCharacter
    ? formatRealmRankWithLevel(
        getRealmRankForPoints(selectedCharacter.totalRealmPoints)
      )
    : "";

  const handleLocalCharacterSelect = (characterId: number) => {
    const selectedCharacter = characters.find(
      (char) => char.character.id === characterId
    )?.character;

    setSelectedCharacterDisplay(
      selectedCharacter
        ? `${selectedCharacter.characterName} (${selectedCharacter.className} ${formattedRank})`
        : "Select a Character"
    );
    onCharacterSelect(characterId);
  };

  useEffect(() => {
    const selectedChar = characters.find(
      (char) => char.character.id === selectedCharacterId
    );

    if (selectedChar) {
      const formattedRank = formatRealmRankWithLevel(
        getRealmRankForPoints(selectedChar.character.totalRealmPoints)
      );

      const newDisplay = `${selectedChar.character.characterName} (${selectedChar.character.className} ${formattedRank})`;
      setSelectedCharacterDisplay(newDisplay);
    } else {
      setSelectedCharacterDisplay("Select a Character");
    }
  }, [characters, selectedCharacterId]);

  return (
    <Card className="w-full max-w-5xl mx-auto border-none  bg-gray-700">
      <CardBody className="">
        <div className="w-full flex justify-center mb-4">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                className="items-center text-white px-4 py-2 bg-gray-900 justify-center w-1/2"
              >
                <span className="text-white text-base">Character</span>
                <KeyboardArrowDownIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              variant="faded"
              aria-label={`Characters for user ${clerkUserId}`}
              className="bg-gray-900 text-indigo-400 max-h-60 overflow-y-auto w-full"
            >
              {sortedCharacters.length > 0 ? (
                sortedCharacters.map(({ character }) => (
                  <DropdownItem
                    key={character.id}
                    onClick={() => handleLocalCharacterSelect(character.id)}
                    className="flex items-center justify-between px-6 py-2 rounded transition-colors duration-200 ease-in-out hover:bg-gray-700"
                  >
                    <span className="truncate block font-bold text-white text-lg">
                      {character.characterName}
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="truncate text-white text-base font-semibold">
                        {character.className}
                      </span>
                      <span className="text-indigo-400 text-base font-semibold">
                        {formatRealmRankWithLevel(
                          getRealmRankForPoints(character.totalRealmPoints)
                        )}
                      </span>
                    </div>
                  </DropdownItem>
                ))
              ) : (
                <DropdownItem className="text-center">
                  No characters
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
        {selectedCharacterId && (
          <div className="flex justify-center items-center">
            <span className="text-white text-lg font-semibold mr-4">
              {selectedCharacter?.characterName}
            </span>
            <span className="text-white text-lg font-semibold mr-4">
              {selectedCharacter?.className}
            </span>
            <span className="text-indigo-400 text-lg font-semibold mr-4">
              {formattedRank}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default GroupCharacterSelector;
