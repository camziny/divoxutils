import * as React from "react";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  default:
    "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 active:bg-indigo-500/35",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
  outline:
    "border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white",
  secondary:
    "bg-gray-800 text-gray-300 shadow-sm hover:bg-gray-700 hover:text-white",
  ghost: "text-gray-400 hover:bg-gray-800/50 hover:text-white",
};

const sizeStyles: Record<string, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs rounded-md",
  lg: "h-10 px-6 text-base",
  xl: "h-12 px-8 text-lg rounded-lg",
  icon: "h-9 w-9",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-40",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
