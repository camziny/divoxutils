"use client";

import React, { useState } from "react";
import { Tooltip, Button } from "@nextui-org/react";
import InfoIcon from "@mui/icons-material/Info";

export default function LeaderboardTooltip() {
  const [visible, setVisible] = useState(false);

  const handleToggle = () => {
    setVisible(!visible);
  };

  return (
    <Tooltip
      content={
        <div className="max-w-xs p-2">
          Leaderboards are updated every Sunday at midnight (UTC). New users or
          characters added during the week will be fully reflected in the
          leaderboard calculations from the second week of their registration.
        </div>
      }
      color="primary"
      placement="top"
      className="bg-gray-700 text-white"
    >
      <Button onClick={handleToggle} className="bg-transparent">
        <InfoIcon className="text-indigo-500" />
      </Button>
    </Tooltip>
  );
}
