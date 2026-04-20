"use client";

import { ShieldCheck } from "lucide-react";

export type PaymentProvider = "stripe" | "paypal";

type PaymentProviderToggleProps = {
  value: PaymentProvider;
  onChange: (provider: PaymentProvider) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

function VisaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      className={className}
      role="img"
      aria-label="Visa"
    >
      <rect width="40" height="24" rx="3" fill="#1434CB" />
      <text
        x="20"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="9.5"
        letterSpacing="0.5"
        fill="#ffffff"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      className={className}
      role="img"
      aria-label="Mastercard"
    >
      <rect width="40" height="24" rx="3" fill="#0B0B0B" />
      <circle cx="16" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="24" cy="12" r="6.5" fill="#F79E1B" />
      <path
        d="M20 7.1a6.5 6.5 0 0 1 0 9.8 6.5 6.5 0 0 1 0-9.8z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      className={className}
      role="img"
      aria-label="American Express"
    >
      <rect width="40" height="24" rx="3" fill="#1F72CD" />
      <text
        x="20"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="7.5"
        letterSpacing="0.6"
        fill="#ffffff"
      >
        AMEX
      </text>
    </svg>
  );
}

function PayPalMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 24"
      className={className}
      role="img"
      aria-label="PayPal"
    >
      <rect width="72" height="24" rx="3" fill="#ffffff" />
      <text
        x="6"
        y="17"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="12.5"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#0070BA">Pal</tspan>
      </text>
    </svg>
  );
}

const OPTIONS: {
  value: PaymentProvider;
  label: string;
  sublabel: string;
}[] = [
  { value: "stripe", label: "Card", sublabel: "Secure card checkout powered by Stripe" },
  { value: "paypal", label: "PayPal", sublabel: "PayPal account or linked bank" },
];

export default function PaymentProviderToggle({
  value,
  onChange,
  disabled = false,
  size = "md",
}: PaymentProviderToggleProps) {
  const padding = size === "sm" ? "px-2.5 py-2" : "px-3 py-2.5";
  const labelSize = size === "sm" ? "text-xs" : "text-sm";
  const sublabelSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const markHeight = size === "sm" ? "h-3" : "h-3.5";
  const markHeightWide = size === "sm" ? "h-3" : "h-3.5";
  const lockSize = size === "sm" ? 10 : 12;

  return (
    <div
      role="radiogroup"
      aria-label="Payment method"
      className="grid grid-cols-2 gap-2 rounded-md border border-gray-800 bg-gray-800/20 p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center justify-start gap-1 ${padding} rounded-[5px] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 ${
              isActive
                ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-100"
                : "border border-transparent text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            <span className="flex items-center gap-1.5 leading-tight">
              <ShieldCheck
                size={lockSize}
                strokeWidth={2.25}
                aria-hidden="true"
                className={isActive ? "text-indigo-300" : "text-gray-500"}
              />
              <span className={`${labelSize} font-semibold`}>{option.label}</span>
            </span>
            <span
              className={`${sublabelSize} leading-tight text-center ${
                isActive ? "text-indigo-200/80" : "text-gray-500"
              }`}
            >
              {option.sublabel}
            </span>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex items-center justify-center gap-1 transition-opacity ${
                isActive ? "opacity-100" : "opacity-70"
              }`}
            >
              {option.value === "stripe" ? (
                <>
                  <VisaMark className={markHeight} />
                  <MastercardMark className={markHeight} />
                  <AmexMark className={markHeight} />
                </>
              ) : (
                <PayPalMark className={markHeightWide} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
