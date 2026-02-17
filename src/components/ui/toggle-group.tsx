import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const ToggleGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: "", onValueChange: () => {} });

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  value,
  onValueChange,
  children,
  className,
}) => {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn(
          "inline-flex rounded-md bg-gray-800 p-0.5",
          className
        )}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
};

const ToggleGroupItem: React.FC<ToggleGroupItemProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const ctx = React.useContext(ToggleGroupContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-[5px] px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150",
        isActive
          ? "bg-gray-700 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export { ToggleGroup, ToggleGroupItem };
