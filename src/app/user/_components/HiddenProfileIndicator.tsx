"use client";

import { EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HiddenProfileIndicator = ({ isOwner }: { isOwner: boolean }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 h-[30px] px-2 rounded-md border border-gray-800 text-[10px] font-medium uppercase tracking-wide text-gray-500 cursor-default">
          <EyeOff size={11} strokeWidth={2} />
          {isOwner ? "Private" : "Hidden"}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-center">
        {isOwner
          ? "Only you can see this — hidden from other players"
          : "Hidden from other players — visible to admins"}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default HiddenProfileIndicator;
