"use client";
import React, { useState } from "react";
import { CreateGroupButtonProps } from "@/utils/group";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import ConstructionIcon from "@mui/icons-material/Construction";
import { toast } from "react-toastify";

function CreateGroupButton({ clerkUserId, name }: CreateGroupButtonProps) {
  const router = useRouter();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const handleCreateGroup = async () => {
    setIsButtonDisabled(true);
    try {
      const groupOwnerEntry = {
        clerkUserId: clerkUserId,
      };
      const response = await fetch("/api/group/createGroup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          realm: "PvP",
          groupOwner: clerkUserId,
          public: true,
          activeUsers: [],
          rosterUsers: [groupOwnerEntry],
        }),
      });

      if (response.ok) {
        toast.success("Group successfully created!");
        const newGroup = await response.json();
        router.refresh();
      } else {
        toast.error("Failed to create group");
        console.error("Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setIsButtonDisabled(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10 mb-20">
      {" "}
      <div className="mb-4 text-3xl font-bold text-center">Group Builder</div>
      <ConstructionIcon
        fontSize="large"
        className="text-6xl text-indigo-500 mb-6"
      />{" "}
      <Button
        onClick={handleCreateGroup}
        disabled={isButtonDisabled}
        className="px-6 py-3 bg-indigo-500 text-white text-lg font-semibold rounded-md shadow hover:bg-indigo-600 transition-colors"
      >
        Start Building Your Group
      </Button>
    </div>
  );
}

export default CreateGroupButton;
