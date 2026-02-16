import * as React from "react";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  default: "border-transparent bg-indigo-600/20 text-indigo-300",
  secondary: "border-transparent bg-gray-800 text-gray-400",
  destructive: "border-transparent bg-red-600/20 text-red-300",
  outline: "border-gray-700 text-gray-400",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
