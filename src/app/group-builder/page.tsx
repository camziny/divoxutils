import React from "react";
import { Suspense } from "react";
import Loading from "../loading";
import GroupBuilderToolTip from "../components/GroupBuilderToolTip";
import GroupBuilderForm from "../components/GroupBuilderForm";
import { currentUser } from "@clerk/nextjs";
import { GroupUser } from "@/utils/group";
import CreateGroupButton from "../components/CreateGroupButton";

async function fetchGroupData(clerkUserId: string) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/group/${clerkUserId}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch group data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching group data:", error);
    return null;
  }
}

async function fetchGroupUsers(groupId: number) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/group/group-by-id/${groupId}/users`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch group users: ${response.status} ${response.statusText}`
      );
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching group users:", error);
    return [];
  }
}

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

    const characters = Array.isArray(data) ? data : data.userCharacters || [];

    const charactersWithRealm = characters.map((character: any) => ({
      ...character,
      realm: character.character.realm,
    }));

    return charactersWithRealm;
  } catch (error) {
    console.error("Error in fetchCharactersForUser:", error);
    return [];
  }
}

export default async function GroupBuilder() {
  const user = await currentUser();
  if (user === null || user.username === null) {
    return <p>User is not logged in.</p>;
  }

  const clerkUserId = user.id;
  const group = await fetchGroupData(clerkUserId);

  if (!group) {
    return <CreateGroupButton clerkUserId={user.id} name={user.username} />;
  }

  const ownerCharacters = await fetchGroupUsersWithCharacters(clerkUserId);
  const groupOwner = {
    clerkUserId,
    name: user.username,
    characters: ownerCharacters,
  };
  let groupUsers = [];
  let groupUsersWithCharacters = [];
  let active = [];
  let roster = [];

  if (group && group.id) {
    groupUsers = await fetchGroupUsers(group.id);
    groupUsersWithCharacters = await Promise.all(
      groupUsers.map(async (user: GroupUser) => {
        const characters = await fetchGroupUsersWithCharacters(
          user.clerkUserId
        );
        return { ...user, characters };
      })
    );

    if (
      !groupUsersWithCharacters.some(
        (user) => user.clerkUserId === groupOwner.clerkUserId
      )
    ) {
      groupUsersWithCharacters = [groupOwner, ...groupUsersWithCharacters];
    }

    active = groupUsersWithCharacters.filter((user) => user.isInActiveGroup);
    roster = groupUsersWithCharacters.filter((user) => !user.isInActiveGroup);

    if (!roster.some((user) => user.clerkUserId === groupOwner.clerkUserId)) {
      roster.push(groupOwner);
    }
  }

  return (
    <div>
      <div className="mb-6 mt-10">
        <GroupBuilderToolTip />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-4 sm:mb-6 text-center">
        {user?.username}&apos;s group
      </div>
      <Suspense fallback={<Loading />}>
        <GroupBuilderForm
          group={group}
          clerkUserId={clerkUserId}
          groupUsers={groupUsersWithCharacters}
          active={active}
          roster={roster}
        />
      </Suspense>
    </div>
  );
}
