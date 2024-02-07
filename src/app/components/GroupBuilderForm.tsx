"use client";
import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import ActiveGroup from "./ActiveGroup";
import GroupUserSearch from "./GroupUserSearch";
import GroupDraggable from "./GroupDraggable";
import GroupRealmSelector from "./GroupRealmSelector";
import CloseIcon from "@mui/icons-material/Close";
import { Checkbox, Button } from "@nextui-org/react";
import { toast } from "react-toastify";
import IosShareIcon from "@mui/icons-material/IosShare";
import {
  GroupUser,
  GroupBuilderFormProps,
  SortOption,
  ClassType,
} from "@/utils/group";
import { DroppableProps } from "@/utils/dnd";
import { useUser } from "@clerk/clerk-react";
import GroupSortAndFilter from "./GroupSortAndFilter";
import GroupCharacterFilter from "./GroupCharacterFilter";

const preprocessUserData = (userData: any) => {
  return userData.map((user: GroupUser) => {
    return {
      id: user.clerkUserId,
      clerkUserId: user.clerkUserId,
      name: user.name,
      characters: user.characters || [],
      isInActiveGroup: user.isInActiveGroup,
    };
  });
};

const GroupBuilderForm: React.FC<GroupBuilderFormProps> = ({
  groupUsers,
  group,
  active,
}) => {
  const [isGroupCreated, setIsGroupCreated] = useState(group != null);
  const [groupData, setGroupData] = useState(null);
  const groupOwnerInitialCharacterId = group
    ? active.find((user) => user.clerkUserId === group.groupOwner)
        ?.characters[0]?.id || null
    : null;

  const { user } = useUser();

  console.log("groupUsers:", groupUsers);

  const initialSelectedCharacters = groupUsers.reduce<{
    [key: string]: number | null;
  }>((acc, user) => {
    const key =
      user.id !== undefined && user.id !== null ? user.id.toString() : null;
    if (key) {
      acc[key] = null;
    }
    return acc;
  }, {});

  if (group && group.groupOwner) {
    initialSelectedCharacters[group.groupOwner.toString()] =
      groupOwnerInitialCharacterId;
  }

  const standardizedUsers = preprocessUserData(groupUsers);

  const [rosterUsers, setRosterUsers] = useState(
    standardizedUsers.filter(
      (user: GroupUser) =>
        !user.isInActiveGroup || user.clerkUserId === group?.groupOwner
    )
  );

  const [activeGroupUsers, setActiveGroupUsers] = useState(
    standardizedUsers.filter(
      (user: GroupUser) =>
        user.isInActiveGroup && user.clerkUserId !== group?.groupOwner
    )
  );
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [selectedRealm, setSelectedRealm] = useState<string>("PvP");
  const [sortOption, setSortOption] = useState<SortOption>("RR High to Low");
  const [classTypeFilters, setClassTypeFilters] = useState<ClassType[]>([]);

  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState(
    initialSelectedCharacters
  );
  const [groupSaved, setGroupSaved] = useState(false);

  function findUserById(id: number | string | null) {
    if (id === null || id === undefined) {
      return null;
    }

    const allUsers = [...rosterUsers, ...activeGroupUsers];
    return allUsers.find((user) => user.id.toString() === id.toString());
  }

  const activeUser = findUserById(activeId);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;
    const draggedUserId = active.id.toString();
    let userToMove =
      rosterUsers.find(
        (user: GroupUser) => user.id?.toString() === draggedUserId
      ) ||
      activeGroupUsers.find(
        (user: GroupUser) => user.id?.toString() === draggedUserId
      );

    if (!userToMove) {
      console.error("Dragged user not found:", draggedUserId);
      return;
    }

    if (over.id === "active-group") {
      if (
        activeGroupUsers.length >= 8 &&
        !activeGroupUsers.some(
          (user: GroupUser) => user.id.toString() === draggedUserId
        )
      ) {
        toast.error("Maximum of 8 users in the active group.");
        return;
      }

      if (
        !activeGroupUsers.some(
          (user: GroupUser) => user.id.toString() === draggedUserId
        )
      ) {
        setActiveGroupUsers((prev: any) => [...prev, userToMove]);
        setRosterUsers((prev: any) =>
          prev.filter(
            (user: GroupUser) => user.id?.toString() !== draggedUserId
          )
        );
      }
    } else if (over.id === "roster") {
      if (
        !rosterUsers.some(
          (user: GroupUser) => user.id.toString() === draggedUserId
        )
      ) {
        setRosterUsers((prev: any) => [...prev, userToMove]);
        setActiveGroupUsers((prev: any) =>
          prev.filter((user: GroupUser) => user.id.toString() !== draggedUserId)
        );
      }
    }
  };

  async function fetchGroupUsersWithCharacters(clerkUserId: string) {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/userCharactersByUserId/${clerkUserId}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Fetch response error: ${JSON.stringify(data)}`);
      }

      return Array.isArray(data) ? data : data.userCharacters || [];
    } catch (error) {
      console.error("Error in fetchCharactersForUser:", error);
      return [];
    }
  }

  const handleUserAddition = async (newUser: any) => {
    const characters = await fetchGroupUsersWithCharacters(newUser.clerkUserId);
    const userWithCharacters = {
      ...newUser,
      characters: characters,
    };

    setRosterUsers((currentUsers: any) => [
      ...currentUsers,
      userWithCharacters,
    ]);
  };

  const handleRemoveUser = async (user: GroupUser) => {
    const { id: userId, clerkUserId } = user;

    setRosterUsers((currentUsers: any) =>
      currentUsers.filter((user: GroupUser) => user.id !== userId)
    );
    setActiveGroupUsers((currentUsers: any) =>
      currentUsers.filter((user: GroupUser) => user.id !== userId)
    );

    try {
      const response = await fetch("/api/group/removeUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group?.id, clerkUserId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to remove user from group:", error);
    }
  };

  const handleIsPrivate = (e: any) => {
    setIsPrivate(e.target.checked);
  };

  const handleCharacterSelect = (userId: string, characterId: number) => {
    setSelectedCharacters((prevState) => {
      const newState = {
        ...prevState,
        [userId]: characterId,
      };
      return newState;
    });
  };

  const handleSaveGroup = async () => {
    setIsLoading(true);
    setGroupSaved(true);

    let groupOwnerCharacterId: number | null = null;

    if (group && group.groupOwner) {
      groupOwnerCharacterId = selectedCharacters[group.groupOwner] ?? null;
    }

    const payload = {
      groupId: group?.id,
      realm: selectedRealm,
      groupOwner: group?.groupOwner,
      public: !isPrivate,
      activeUsers: activeGroupUsers.map((user: GroupUser) => ({
        clerkUserId: user.clerkUserId,
        selectedCharacterId:
          user.clerkUserId === group?.groupOwner
            ? groupOwnerCharacterId
            : selectedCharacters[user.id],
      })),
      rosterUsers: rosterUsers.map((user: GroupUser) => ({
        clerkUserId: user.clerkUserId,
      })),
    };

    try {
      const response = await fetch("/api/group/saveGroup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success("Group saved successfully!");
    } catch (error) {
      console.error("Failed to save the group:", error);
      toast.error("Failed to save the group");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareGroup = () => {
    const username = group?.name;
    const urlToCopy = `${window.location.origin}/user/${username}/group`;

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        toast("Link copied to clipboard", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GroupUserSearch onUserAdd={handleUserAddition} group={group} />
      <div className="flex flex-col sm:flex-row items-center justify-center my-4 space-y-4 sm:space-y-0 sm:space-x-8">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:items-center">
          <span className="text-xl font-medium text-gray-400 mb-2 sm:mb-0 sm:mr-3">
            Realm:
          </span>
          <GroupRealmSelector
            selectedRealm={selectedRealm}
            setSelectedRealm={setSelectedRealm}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center sm:items-center">
          <span className="text-xl font-medium text-gray-400 mb-2 sm:mb-0 sm:mr-3">
            Sort Characters:
          </span>
          <GroupSortAndFilter setSortOption={setSortOption} />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <Checkbox
              aria-label="Private"
              checked={isPrivate}
              onChange={handleIsPrivate}
              color="default"
              size="lg"
            />
            <span className="text-xl ml-2">Private</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center text-center sm:text-left">
        <span className="text-xl font-medium text-gray-400 mb-2 sm:mb-0 sm:mr-3">
          Filters:
        </span>
        <GroupCharacterFilter onFilterChange={setClassTypeFilters} />
      </div>
      <Droppable
        id="roster"
        items={rosterUsers}
        selectedRealm={selectedRealm}
        onRemove={handleRemoveUser}
        selectedCharacters={selectedCharacters}
        handleCharacterSelect={handleCharacterSelect}
        onDrop={handleDragEnd}
      />
      <ActiveGroup
        users={activeGroupUsers}
        selectedRealm={selectedRealm}
        sortOption={sortOption}
        selectedCharacters={selectedCharacters}
        onCharacterSelect={handleCharacterSelect}
        classTypeFilters={classTypeFilters}
      />
      <DragOverlay
        modifiers={[restrictToWindowEdges]}
        dropAnimation={{
          duration: 400,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeUser && (
          <div className="relative">
            {" "}
            <GroupDraggable
              user={activeUser}
              isOverlay={true}
              selectedRealm={selectedRealm}
              selectedCharacters={selectedCharacters}
              onCharacterSelect={handleCharacterSelect}
            >
              <div className="user-item-style">{activeUser.name}</div>
            </GroupDraggable>
            <button
              onClick={() => handleRemoveUser(activeUser)}
              className="absolute top-0 right-0 m-1 text-white bg-gray-600 hover:bg-gray-700 rounded-full p-1 z-10"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </DragOverlay>
      <div className="flex justify-center mt-5">
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className="bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 transition duration-300 ease-in-out"
            onClick={handleSaveGroup}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Group"}
          </Button>
          {groupSaved && (
            <Button
              size="lg"
              className="bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 transition duration-300 ease-in-out"
              onClick={handleShareGroup}
            >
              <span className="mr-2">Share</span>
              <IosShareIcon />
            </Button>
          )}
        </div>
      </div>
    </DndContext>
  );
};

const Droppable: React.FC<DroppableProps> = ({
  id,
  items,
  selectedRealm,
  onRemove,
  selectedCharacters,
  handleCharacterSelect,
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-800 border border-gray-600 shadow-xl rounded-lg p-6 m-4 transition duration-150 ease-in-out hover:shadow-2xl flex flex-col items-center max-w-5xl mx-auto"
    >
      <h3 className="text-indigo-400 text-center text-2xl font-semibold mb-6">
        Roster
      </h3>
      <div className="w-full">
        {" "}
        <div className="flex flex-wrap justify-center gap-4">
          {" "}
          {items.map(
            (user: GroupUser) =>
              user?.id && (
                <div className="relative" key={user.id}>
                  {" "}
                  <GroupDraggable
                    user={user}
                    isOverlay={true}
                    selectedRealm={selectedRealm}
                    selectedCharacters={selectedCharacters}
                    onCharacterSelect={handleCharacterSelect}
                  />
                  <button
                    onClick={() => onRemove(user)}
                    className="absolute top-0 right-0 m-1 text-white bg-gray-600 hover:bg-gray-700 rounded-full p-1 z-10"
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CloseIcon className="h-1 w-1" />
                  </button>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};
export default GroupBuilderForm;
