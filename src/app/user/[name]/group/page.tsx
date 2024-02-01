import React from "react";
import { Suspense } from "react";
import Loading from "@/app/loading";
import ViewGroup from "@/app/components/ViewGroup";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import { GroupUser } from "@/utils/group";

interface GroupPageParams {
  name: string;
  clerkUserId: string;
}

export default async function GroupPage({
  params,
}: {
  params: GroupPageParams;
}) {
  const { name } = params;
  const uniqueParam = `?t=${new Date().getTime()}`;

  const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/group/group-by-name/${name}${uniqueParam}`;
  const res = await fetch(fetchUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const groupData = await res.json();

  const group = groupData;

  const usersResFetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/group/group-by-id/${group.id}/group-with-characters${uniqueParam}`;

  const usersRes = await fetch(usersResFetchUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!usersRes.ok) {
    throw new Error(
      `Failed to fetch group users: ${usersRes.status} ${usersRes.statusText}`
    );
  }
  const usersData = await usersRes.json();

  const groupOwnerClerkUserId = group.groupOwner;

  const groupOwnerResFetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/group/group-owner?groupId=${group.id}&clerkUserId=${groupOwnerClerkUserId}`;

  const groupOwnerRes = await fetch(groupOwnerResFetchUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
  if (!groupOwnerRes.ok) {
    throw new Error(
      `Failed to fetch group owner: ${groupOwnerRes.status} ${groupOwnerRes.statusText}`
    );
  }
  const groupOwnerData = await groupOwnerRes.json();

  const filteredUsersData: GroupUser[] = usersData.filter(
    (user: GroupUser) => user.clerkUserId !== groupOwnerClerkUserId
  );

  const combinedUserData = [groupOwnerData, ...filteredUsersData];

  const privateStatus = group.public ? (
    <LockOpenIcon fontSize="medium" />
  ) : (
    <LockIcon fontSize="medium" />
  );

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-4xl font-bold text-indigo-400 mb-3 text-center">
          {group.name}&apos;s group
        </h1>
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-3xl font-bold text-white mr-3">{group.realm}</h2>
          <span>{privateStatus}</span>
        </div>
        <ViewGroup
          groupOwnerData={groupOwnerData}
          usersData={combinedUserData}
          isGroupPrivate={!group.public}
          activeGroupUserIds={filteredUsersData
            .filter((user: GroupUser) => user.isInActiveGroup)
            .map((user: GroupUser) => user.clerkUserId)}
        />
        <Suspense fallback={<Loading />}></Suspense>
      </div>
    </div>
  );
}
