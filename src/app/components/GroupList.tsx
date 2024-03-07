import React from "react";

type Group = {
  id: number;
  name: string;
};

async function fetchGroupsForUser(userId: string) {
  const apiUrl = `/api/group/${userId}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Fetch response error: ${JSON.stringify(data)}`);
    }
    return data;
  } catch (error) {
    console.error("Error in fetchGroupsForUser:", error);
    throw error;
  }
}

export default async function GroupList({ userId }: { userId: string }) {
  if (!userId) {
    return <p>User is not authenticated. Please log in to view groups.</p>;
  }

  let groups: Group[] = [];
  try {
    groups = await fetchGroupsForUser(userId);
  } catch (error) {
    if (error instanceof Error) {
      return <p>Failed to load groups: {error.message}</p>;
    } else {
      return <p>An unknown error occurred.</p>;
    }
  }

  return (
    <div>
      {groups.length === 0 ? (
        <p>No groups available.</p>
      ) : (
        groups.map((group) => <div key={group.id}>{group.name}</div>)
      )}
    </div>
  );
}
