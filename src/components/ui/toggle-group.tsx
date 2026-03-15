import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const ToggleGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  groupId: string;
}>({ value: "", onValueChange: () => {}, groupId: "" });

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  value,
  onValueChange,
  children,
  className,
}) => {
  const groupId = React.useId();

  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange, groupId }}>
      <LayoutGroup id={groupId}>
        <div
          className={cn(
            "inline-flex rounded-md bg-gray-800 p-0.5",
            className
          )}
        >
          {children}
        </div>
      </LayoutGroup>
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
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-[5px] px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-150",
        isActive
          ? "bg-gray-700 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-300",
        className
      )}
      {...props}
    >
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId={`toggle-bg-${ctx.groupId}`}
            className="absolute inset-0 rounded-[5px] bg-gray-700 shadow-sm"
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
    </button>
  );
};

export { ToggleGroup, ToggleGroupItem };
