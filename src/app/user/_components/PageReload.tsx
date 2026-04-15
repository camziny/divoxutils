"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const PageReload = () => {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return <></>;
};
