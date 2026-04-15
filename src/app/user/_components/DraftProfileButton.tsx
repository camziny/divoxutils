"use client";
import React from "react";
import Link from "next/link";
import { Swords } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconButtonClass =
  "flex items-center justify-center text-gray-500 hover:text-gray-300 p-2 rounded-md border border-gray-800 hover:border-gray-700 bg-transparent hover:bg-gray-800/50 transition-colors duration-150";

const DraftProfileButton = ({ href }: { href: string }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className={iconButtonClass}>
          <Swords size={14} strokeWidth={2} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Draft Profile</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default DraftProfileButton;
