import React from "react";
import { Suspense } from "react";
import Loading from "../loading";
import GroupBuilderToolTip from "../components/GroupBuilderToolTip";
import GroupBuilderForm from "../components/GroupBuilderForm";

type GroupBuilderProps = {
  username: string;
};

async function fetchGroupData(username: string) {
  try {
    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/group/${username}?timestamp=${new Date().getTime()}`;
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

export default async function GroupBuilder({ username }: GroupBuilderProps) {
  const groupData = await fetchGroupData(username);

  return (
    <div>
      <div className="mb-6">
        <GroupBuilderToolTip />
      </div>
      <Suspense fallback={<Loading />}>
        <GroupBuilderForm group={groupData} />
      </Suspense>
    </div>
  );
}
