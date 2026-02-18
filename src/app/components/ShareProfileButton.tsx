"use client";
import React, { useState } from "react";
import { Share, Check } from "lucide-react";
import { toast } from "sonner";

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

      toast.success("Profile link copied to clipboard");
    });
  };

  return (
    <button
      onClick={handleShareClick}
      className="
        flex items-center justify-center
        text-gray-500 hover:text-gray-300
        p-2 rounded-md
        border border-gray-800 hover:border-gray-700
        bg-transparent hover:bg-gray-800/50
        transition-colors duration-150
      "
    >
      {copied ? (
        <Check size={15} strokeWidth={2} />
      ) : (
        <Share size={15} strokeWidth={2} />
      )}
    </button>
  );
};

export default ShareProfileButton;
