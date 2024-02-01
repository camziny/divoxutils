"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@nextui-org/react";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { ViewGroupProps } from "@/utils/group";
import { toast } from "react-toastify";
import { Button } from "@nextui-org/react";
import IosShareIcon from "@mui/icons-material/IosShare";
import Loading from "../loading";

const ViewGroup: React.FC<ViewGroupProps> = ({
  groupOwnerData,
  usersData,
  isGroupPrivate,
  activeGroupUserIds,
}) => {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAllowedToView, setIsUserAllowedToView] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const loggedInUserId = user?.id || "";
    const isUserLoggedIn = loggedInUserId !== "";
    const isAllowed =
      !isGroupPrivate ||
      (isUserLoggedIn && activeGroupUserIds?.includes(loggedInUserId));

    setIsUserAllowedToView(isAllowed);
    setIsLoading(false);
  }, [user, isLoaded, isGroupPrivate, activeGroupUserIds]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isUserAllowedToView) {
    return (
      <div className="text-center mb-10 my-5">
        The owner of this group has made it only viewable to members of the
        group.
      </div>
    );
  }

  const handleShareGroup = () => {
    const groupOwnerName = groupOwnerData.user.name;
    const urlToCopy = `${window.location.origin}/user/${groupOwnerName}/group`;

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

  const reduceFontSize = (text: string) => {
    return text.length > 12
      ? "text-md font-bold"
      : "text-lg font-bold md:text-xl";
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center">
        <div className="grid grid-cols-2 gap-x-6 gap-y-0 md:gap-x-16 md:gap-y-6 max-w-full mx-auto">
          {usersData.slice(0, 8).map((groupUser) => (
            <div key={groupUser.clerkUserId} className="mb-5 w-full">
              <Card className="shadow-md bg-gray-700 h-[200px] md:w-[250px] w-[150px]">
                <CardHeader className="flex justify-between items-center mb-2 md:mb-4 bg-gray-600">
                  <Link href={`/user/${groupUser.user.name}/characters`}>
                    <span className="text-indigo-300 text-lg md:text-2xl font-semibold whitespace-normal break-words">
                      {groupUser.user.name}
                    </span>
                  </Link>
                </CardHeader>
                {groupUser.character && (
                  <CardBody className="space-y-1 md:space-y-2 p-2 md:p-4">
                    <span className="text-white font-semibold text-lg truncate">
                      {groupUser.character.characterName}
                    </span>
                    <span className="text-white font-semibold text-lg">
                      {groupUser.character.className}
                    </span>
                    <span className="text-indigo-400 text-lg md:text-xl font-semibold">
                      {formatRealmRankWithLevel(
                        getRealmRankForPoints(
                          groupUser.character.totalRealmPoints
                        )
                      )}
                    </span>
                  </CardBody>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center mb-6 mt-0">
        <Button
          size="lg"
          className="bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 transition duration-300 ease-in-out"
          onClick={handleShareGroup}
        >
          <span className="mr-2">Share</span>
          <IosShareIcon />
        </Button>
      </div>
    </div>
  );
};

export default ViewGroup;
