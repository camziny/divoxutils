"use client";
import React from "react";
import { Tooltip as RechartsTooltip } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = {
  config?: ChartConfig;
  className?: string;
  children: React.ReactNode;
};

export function ChartContainer({ config, className, children }: ChartContainerProps) {
  const styleVars: React.CSSProperties = {};
  if (config) {
    Object.entries(config).forEach(([key, value], idx) => {
      const color = value?.color;
      if (color) {
        (styleVars as any)[`--chart-${idx + 1}`] = color;
      }
    });
  }

  return (
    <div className={className} style={styleVars}>
      {children}
    </div>
  );
}

export const ChartTooltip = RechartsTooltip;

type ChartTooltipContentProps = {
  label?: string;
  payload?: Array<{ name: string; value: number; color?: string }>;
};

export function ChartTooltipContent({ label, payload }: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="border border-gray-700/60 bg-gray-900/95 rounded-md px-2.5 py-1.5 text-xs shadow-xl">
      {label ? <div className="font-medium text-gray-200 mb-1">{label}</div> : null}
      <div className="space-y-0.5">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="text-gray-400">{item.name}</span>
            <span className="text-gray-200 font-mono tabular-nums">{Number(item.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


