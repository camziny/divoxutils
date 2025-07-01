"use client";
import React, { useState } from "react";
import IosShareIcon from "@mui/icons-material/IosShare";
import { toast } from "react-toastify";
import CheckIcon from "@mui/icons-material/Check";

interface ShareProfileButtonProps {
  username: string;
}

const ShareProfileButton: React.FC<ShareProfileButtonProps> = ({
  username,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    const url = `${window.location.origin}/user/${username}/characters`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast(`Profile link copied to clipboard`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
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
      className="
        flex items-center justify-center
        bg-gray-800 hover:bg-gray-700
        text-gray-400 hover:text-white
        border border-gray-700 hover:border-gray-600
        rounded-lg p-2
        transition-colors duration-200
      "
    >
      {copied ? (
        <CheckIcon style={{ fontSize: "1.2rem" }} />
      ) : (
        <IosShareIcon style={{ fontSize: "1.2rem" }} />
      )}
    </button>
  );
};

export default ShareProfileButton;
