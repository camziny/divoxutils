import React from "react";
import { useDraggable } from "@dnd-kit/core";
import GroupCharacterSelector from "./GroupCharacterSelector";
import { GroupDraggableProps } from "@/utils/dnd";

const GroupDraggable: React.FC<
  React.PropsWithChildren<GroupDraggableProps>
> = ({
  user,
  isOverlay,
  selectedRealm,
  isInActiveGroup,
  selectedCharacters,
  onCharacterSelect,
}) => {
  const userId = user && user.id ? user.id.toString() : null;

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: userId,
  });
  const selectedCharacterId =
    selectedCharacters && userId ? selectedCharacters[userId] ?? null : null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative bg-gray-800 border border-gray-500 rounded-md p-2 m-1 cursor-grab hover:bg-gray-600 transition duration-200 ease-in-out w-full max-w-xs"
    >
      <div className="flex justify-between items-center text-white">
        <div className="font-semibold text-lg text-indigo-400 p-2 truncate flex-1">
          {user.name}
        </div>
        {isInActiveGroup && <div className="flex-shrink-0"> </div>}
      </div>
    </div>
  );
};

export default GroupDraggable;
