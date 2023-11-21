"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useEffect } from "react";

export const PageReload = () => {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return <></>;
};
