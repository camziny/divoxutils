"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Info } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HideProfileToggleProps {
  initialHideProfile: boolean;
}

const HideProfileToggle: React.FC<HideProfileToggleProps> = ({
  initialHideProfile,
}) => {
  const [hideProfile, setHideProfile] = useState(initialHideProfile);
  const inFlightRequest = useRef<AbortController | null>(null);

  const handleChange = useCallback(
    async (value: string) => {
      const nextHideProfile = value === "hidden";
      if (nextHideProfile === hideProfile) return;

      inFlightRequest.current?.abort();
      const controller = new AbortController();
      inFlightRequest.current = controller;

      const previousHideProfile = hideProfile;
      setHideProfile(nextHideProfile);

      try {
        const response = await fetch("/api/user/preferences/hide-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hideProfile: nextHideProfile }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Could not save profile visibility");
        }
        if (inFlightRequest.current !== controller) return;
        toast.success(
          nextHideProfile
            ? "Your characters are now hidden from other players and leaderboards"
            : "Your characters are visible again"
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (inFlightRequest.current !== controller) return;
        setHideProfile(previousHideProfile);
        toast.error("Could not save profile visibility");
      }
    },
    [hideProfile]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900/40 pl-2.5 pr-1.5 py-1">
        {hideProfile ? (
          <EyeOff size={13} strokeWidth={2} className="text-gray-500 shrink-0" />
        ) : (
          <Eye size={13} strokeWidth={2} className="text-gray-500 shrink-0" />
        )}
        <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
          Profile
        </span>
        <ToggleGroup
          value={hideProfile ? "hidden" : "visible"}
          onValueChange={handleChange}
        >
          <ToggleGroupItem value="visible">Visible</ToggleGroupItem>
          <ToggleGroupItem value="hidden">Hidden</ToggleGroupItem>
        </ToggleGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors duration-150">
              <Info size={13} strokeWidth={2} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-center">
            Hides your character list from your public profile and
            leaderboards. You&apos;ll still appear in search.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default HideProfileToggle;
