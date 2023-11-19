import React from "react";
import OtherCharacterList from "@/app/components/OtherCharacterList";
import InfoIcon from "@mui/icons-material/Info";
import { Tooltip } from "@mui/material";

interface CharactersPageParams {
  userId: string;
}

export default async function CharactersPage({
  params,
}: {
  params: CharactersPageParams;
}) {
  const userId = params.userId;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  const userData = await res.json();

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2 text-center">
          {userData.name}
        </h1>
        <div className="mb-6 text-center">
          <Tooltip
            title="If the list of characters doesn't seem updated, try refreshing the page."
            arrow
            placement="right"
            sx={{
              tooltip: {
                bgColor: "#1A202C",
                color: "white",
                fontSize: "0.875rem",
                border: "1px solid #5A67D8",
              },
              arrow: {
                color: "#1A202C",
              },
            }}
          >
            <InfoIcon className="text-indigo-400 ml-1" />
          </Tooltip>
        </div>
        <OtherCharacterList userId={userId} />
      </div>
    </div>
  );
}
