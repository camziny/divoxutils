import React from "react";
import GroupDraggable from "./GroupDraggable";
import { useDroppable } from "@dnd-kit/core";
import GroupCharacterSelector from "./GroupCharacterSelector";
import { ActiveGroupProps, Realm } from "@/utils/group";

const ActiveGroup: React.FC<ActiveGroupProps> = ({
  users,
  selectedRealm,
  selectedCharacters,
  onCharacterSelect,
}) => {
  const { setNodeRef } = useDroppable({ id: "active-group" });

  let validRealm: Realm;

  switch (selectedRealm) {
    case "Albion":
    case "Hibernia":
    case "Midgard":
    case "PvP":
      validRealm = selectedRealm;
      break;
    default:
      validRealm = "Albion";
  }

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-800 border-2 border-gray-600 shadow-xl rounded-lg p-6 m-4 transition-all duration-150 ease-in-out hover:shadow-2xl flex flex-col items-center max-w-5xl mx-auto"
    >
      <h3 className="text-indigo-400 text-center text-2xl font-semibold mb-6">
        Active Group
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {users.map((user, index) => {
          const userId = user.id ? user.id.toString() : null;
          const selectedCharacterId =
            selectedCharacters && userId
              ? selectedCharacters[userId] ?? null
              : null;

          return (
            <div
              key={user.id}
              className="relative bg-gray-800 border-gray-500 rounded-md p-4 cursor-grab hover:shadow-md transition-all duration-200 ease-in-out w-full max-w-xl mx-auto"
            >
              <div className="flex flex-col items-center justify-center space-y-4 w-full">
                <div className="flex justify-center w-full">
                  <GroupDraggable
                    user={user}
                    selectedRealm={selectedRealm}
                    isInActiveGroup={true}
                    isOverlay={true}
                    selectedCharacters={selectedCharacters}
                    onCharacterSelect={onCharacterSelect}
                  >
                    <div className="text-lg font-semibold text-white truncate text-center">
                      {user.name}
                    </div>
                  </GroupDraggable>
                </div>
              </div>
              <div className="flex justify-center w-full cursor-default">
                <GroupCharacterSelector
                  clerkUserId={user.clerkUserId}
                  characters={user.characters}
                  selectedCharacterId={selectedCharacterId}
                  onCharacterSelect={(characterId: number) =>
                    onCharacterSelect(user.id.toString(), characterId)
                  }
                  selectedRealm={validRealm as Realm}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveGroup;
