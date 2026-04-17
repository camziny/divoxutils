"use client";

import React, { ReactNode } from "react";
import { NextUIProvider } from "@nextui-org/react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <NextUIProvider>{children}</NextUIProvider>;
}
