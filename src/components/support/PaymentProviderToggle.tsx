"use client";

import { Lock } from "lucide-react";

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

function PayPalMark({ className, muted = false }: { className?: string; muted?: boolean }) {
  const dark = muted ? "#6B7FCF" : "#003087";
  const light = muted ? "#7BAEE6" : "#009CDE";
  return (
    <svg
      viewBox="0 0 46 56"
      className={className}
      role="img"
      aria-label="PayPal"
    >
      <path
        d="M39.2 11.9c0-.1 0-.2.1-.3C37.8 5.5 32.3 2 25.3 2H10.1c-1.1 0-2 .8-2.2 1.9L2 38.3c-.1.8.5 1.5 1.3 1.5h9.5l-.7 4.3c-.1.7.4 1.3 1.1 1.3h8c.9 0 1.7-.7 1.9-1.6l.1-.4 1.5-9.5.1-.5c.2-.9.9-1.6 1.9-1.6h1.2c7.6 0 13.5-3.1 15.3-12.1.7-3.7.3-6.8-1.5-9z"
        fill={light}
      />
      <path
        d="M39.2 11.9c0-.1 0-.2.1-.3C37.8 5.5 32.3 2 25.3 2H10.1c-1.1 0-2 .8-2.2 1.9L2 38.3c-.1.8.5 1.5 1.3 1.5h9.5l2.4-15.1-.1.2c.2-1.1 1.1-1.9 2.2-1.9h4.5c8.8 0 15.7-3.6 17.7-13.9.1-.3.1-.6.2-.9-.3-.1-.3-.1 0 0 .5-3.5.0-5.8-1.5-8z"
        fill={dark}
      />
    </svg>
  );
}

export default function PaymentProviderToggle({
  value,
  onChange,
  disabled = false,
  size = "md",
}: PaymentProviderToggleProps) {
  const isSmall = size === "sm";
  const markH = isSmall ? "h-[13px]" : "h-[15px]";
  const paypalMarkH = isSmall ? "h-4" : "h-[18px]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Lock
          size={isSmall ? 10 : 11}
          strokeWidth={2.5}
          className="text-gray-400"
          aria-hidden="true"
        />
        <span className={`${isSmall ? "text-[10px]" : "text-[11px]"} font-medium text-gray-400 uppercase tracking-wider`}>
          Payment method
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "stripe"}
          disabled={disabled}
          onClick={() => onChange("stripe")}
          className={`flex items-center justify-center gap-2 rounded-md ${
            isSmall ? "px-3 py-2" : "px-4 py-2.5"
          } border transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 ${
            value === "stripe"
              ? "border-indigo-500/40 bg-indigo-500/[0.08] ring-1 ring-indigo-500/20"
              : "border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/40"
          }`}
        >
          <span className={`flex items-center gap-1 ${value === "stripe" ? "opacity-100" : "opacity-75"}`}>
            <VisaMark className={markH} />
            <MastercardMark className={markH} />
            <AmexMark className={markH} />
          </span>
          <span className={`${isSmall ? "text-xs" : "text-sm"} font-medium ${
            value === "stripe" ? "text-white" : "text-gray-400"
          }`}>
            Card
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "paypal"}
          disabled={disabled}
          onClick={() => onChange("paypal")}
          className={`flex items-center justify-center gap-2 rounded-md ${
            isSmall ? "px-3 py-2" : "px-4 py-2.5"
          } border transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 ${
            value === "paypal"
              ? "border-indigo-500/40 bg-indigo-500/[0.08] ring-1 ring-indigo-500/20"
              : "border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/40"
          }`}
        >
          <PayPalMark className={`${paypalMarkH} w-auto`} muted={value !== "paypal"} />
          <span className={`${isSmall ? "text-xs" : "text-sm"} font-medium ${
            value === "paypal" ? "text-white" : "text-gray-400"
          }`}>
            PayPal
          </span>
        </button>
      </div>
      <p className={`${isSmall ? "text-[10px]" : "text-[11px]"} text-gray-500 leading-tight`}>
        Powered by Stripe and PayPal. Payment details are never stored.
      </p>
    </div>
  );
}
