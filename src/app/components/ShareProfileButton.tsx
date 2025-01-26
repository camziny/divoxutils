"use client";
import React from "react";
import IosShareIcon from "@mui/icons-material/IosShare";
import { toast } from "react-toastify";

interface ShareProfileButtonProps {
  username: string | null;
}

const ShareProfileButton: React.FC<ShareProfileButtonProps> = ({
  username,
}) => {
  const handleShareClick = () => {
    const url = `${window.location.origin}/user/${username}/characters`;
    navigator.clipboard.writeText(url).then(() => {
      toast(`${username}'s shareable profile link copied to clipboard`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    });
  };

  return (
    <button
      onClick={handleShareClick}
      className="bg-gray-900 text-indigo-400 hover:bg-gray-800 rounded-lg active:bg-gray-700 transition duration-300 ease-in-out flex items-center p-1"
    >
      <IosShareIcon style={{ fontSize: "1.60rem", verticalAlign: "middle" }} />
    </button>
  );
};

export default ShareProfileButton;
