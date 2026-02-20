"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SupporterBadgeProps = {
  tier: number;
  size?: "sm" | "md";
  showTooltip?: boolean;
};

const tierLabels: Record<number, string> = {
  1: "Tier 1 Supporter",
  2: "Tier 2 Supporter",
  3: "Tier 3 Supporter",
};

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);

const AnimatedShieldIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  const reactId = React.useId();
  const gradId = `sh-g-${reactId.replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="14" y2="24">
          <stop offset="0" stopColor="#818CF8" />
          <stop offset="0.15" stopColor="#818CF8" />
          <stop offset="0.3" stopColor="#939EF8" />
          <stop offset="0.42" stopColor="#A5B4FC" />
          <stop offset="0.5" stopColor="#C7D2FE" />
          <stop offset="0.58" stopColor="#A5B4FC" />
          <stop offset="0.7" stopColor="#939EF8" />
          <stop offset="0.85" stopColor="#818CF8" />
          <stop offset="1" stopColor="#818CF8" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-34 0"
            to="34 0"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
};

const DiamondIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M19 5L12 2 5 5 2 9l10 13L22 9l-3-4zm-7 11.58L5.24 8.74 7.03 6.2 12 4.12l4.97 2.08 1.79 2.54L12 16.58z" />
    <path d="M12 4.12L7.03 6.2 5.24 8.74 12 16.58l6.76-7.84L16.97 6.2 12 4.12z" opacity="0.6" />
  </svg>
);

const iconSizes: Record<string, Record<number, string>> = {
  sm: { 1: "w-4 h-4", 2: "w-3.5 h-3.5", 3: "w-3.5 h-3.5" },
  md: { 1: "w-6 h-6", 2: "w-5 h-5", 3: "w-5 h-5" },
};

const tier2Styles = `
@keyframes shield-breathe {
  0%, 100% {
    filter: drop-shadow(0 0 3px rgba(129,140,248,0.4)) drop-shadow(0 0 8px rgba(129,140,248,0.2));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 7px rgba(129,140,248,0.85)) drop-shadow(0 0 16px rgba(129,140,248,0.45));
    transform: scale(1.04);
  }
}

@keyframes spark-1 {
  0%, 12%, 100% { opacity: 0; transform: rotate(-30deg) scaleY(1); }
  4% { opacity: 0; }
  5% { opacity: 1; transform: rotate(-30deg) scaleY(1.2); }
  9% { opacity: 0.8; transform: rotate(-30deg) scaleY(0.8); }
}

@keyframes spark-2 {
  0%, 32%, 50%, 100% { opacity: 0; transform: rotate(40deg) scaleY(1); }
  34% { opacity: 0; }
  35% { opacity: 1; transform: rotate(40deg) scaleY(1.3); }
  42% { opacity: 0.7; transform: rotate(42deg) scaleY(0.7); }
}

@keyframes spark-3 {
  0%, 58%, 72%, 100% { opacity: 0; transform: rotate(-60deg) scaleY(1); }
  60% { opacity: 0; }
  61% { opacity: 1; transform: rotate(-58deg) scaleY(1.1); }
  68% { opacity: 0.6; transform: rotate(-62deg) scaleY(0.9); }
}

@keyframes spark-4 {
  0%, 78%, 92%, 100% { opacity: 0; transform: rotate(15deg) scaleY(1); }
  80% { opacity: 0; }
  81% { opacity: 0.9; transform: rotate(15deg) scaleY(1.2); }
  88% { opacity: 0.5; transform: rotate(18deg) scaleY(0.8); }
}

@keyframes spark-5 {
  0%, 18%, 30%, 100% { opacity: 0; transform: rotate(-10deg) scaleY(1); }
  20% { opacity: 0; }
  21% { opacity: 1; transform: rotate(-12deg) scaleY(1.15); }
  27% { opacity: 0.6; transform: rotate(-8deg) scaleY(0.85); }
}
`;

const flameStyles = `
@keyframes fl-left-1 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(12deg);
    border-radius: 30% 70% 45% 55%;
    opacity: 0.75;
  }
  25% {
    transform: translate(4px, -10px) scaleY(2.0) scaleX(0.5) rotate(6deg);
    border-radius: 25% 65% 40% 60%;
    opacity: 1;
  }
  50% {
    transform: translate(6px, -18px) scaleY(1.3) scaleX(0.6) rotate(18deg);
    border-radius: 50% 40% 35% 65%;
    opacity: 0.45;
  }
  75% {
    transform: translate(2px, -12px) scaleY(2.3) scaleX(0.4) rotate(4deg);
    border-radius: 35% 55% 50% 45%;
    opacity: 0.85;
  }
}

@keyframes fl-left-2 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1.1) scaleX(0.9) rotate(18deg);
    border-radius: 35% 65% 50% 50%;
    opacity: 0.6;
  }
  20% {
    transform: translate(2px, -7px) scaleY(1.7) scaleX(0.55) rotate(10deg);
    border-radius: 28% 62% 42% 58%;
    opacity: 0.9;
  }
  45% {
    transform: translate(5px, -14px) scaleY(1.4) scaleX(0.7) rotate(22deg);
    border-radius: 48% 42% 35% 65%;
    opacity: 0.5;
  }
  70% {
    transform: translate(1px, -9px) scaleY(2.1) scaleX(0.45) rotate(8deg);
    border-radius: 30% 60% 55% 40%;
    opacity: 0.8;
  }
}

@keyframes fl-right-1 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(-12deg);
    border-radius: 70% 30% 55% 45%;
    opacity: 0.7;
  }
  20% {
    transform: translate(-3px, -9px) scaleY(1.8) scaleX(0.55) rotate(-20deg);
    border-radius: 60% 30% 48% 52%;
    opacity: 1;
  }
  45% {
    transform: translate(-6px, -17px) scaleY(1.5) scaleX(0.6) rotate(-6deg);
    border-radius: 40% 50% 55% 40%;
    opacity: 0.5;
  }
  70% {
    transform: translate(-2px, -20px) scaleY(1.2) scaleX(0.55) rotate(-16deg);
    border-radius: 55% 35% 42% 58%;
    opacity: 0.65;
  }
}

@keyframes fl-right-2 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1.1) scaleX(0.9) rotate(-18deg);
    border-radius: 65% 35% 50% 50%;
    opacity: 0.55;
  }
  25% {
    transform: translate(-2px, -8px) scaleY(1.9) scaleX(0.5) rotate(-10deg);
    border-radius: 55% 35% 45% 55%;
    opacity: 0.95;
  }
  50% {
    transform: translate(-5px, -15px) scaleY(1.3) scaleX(0.65) rotate(-24deg);
    border-radius: 45% 45% 38% 62%;
    opacity: 0.45;
  }
  75% {
    transform: translate(-1px, -11px) scaleY(2.2) scaleX(0.4) rotate(-7deg);
    border-radius: 58% 32% 52% 42%;
    opacity: 0.8;
  }
}

@keyframes fl-top-1 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(0deg);
    border-radius: 40% 60% 45% 55%;
    opacity: 0.65;
  }
  20% {
    transform: translate(2px, -9px) scaleY(2.2) scaleX(0.45) rotate(5deg);
    border-radius: 35% 55% 42% 58%;
    opacity: 1;
  }
  45% {
    transform: translate(-2px, -18px) scaleY(1.4) scaleX(0.6) rotate(-4deg);
    border-radius: 50% 40% 48% 52%;
    opacity: 0.4;
  }
  65% {
    transform: translate(1px, -12px) scaleY(2.5) scaleX(0.35) rotate(3deg);
    border-radius: 38% 58% 55% 42%;
    opacity: 0.9;
  }
  85% {
    transform: translate(-1px, -22px) scaleY(1.1) scaleX(0.5) rotate(-2deg);
    border-radius: 52% 42% 40% 60%;
    opacity: 0.3;
  }
}

@keyframes fl-top-2 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(2deg);
    border-radius: 55% 45% 48% 52%;
    opacity: 0.6;
  }
  30% {
    transform: translate(-1px, -10px) scaleY(2.0) scaleX(0.5) rotate(-3deg);
    border-radius: 42% 52% 55% 45%;
    opacity: 0.95;
  }
  55% {
    transform: translate(2px, -20px) scaleY(1.5) scaleX(0.55) rotate(6deg);
    border-radius: 48% 48% 38% 62%;
    opacity: 0.35;
  }
  80% {
    transform: translate(0, -14px) scaleY(2.3) scaleX(0.4) rotate(-5deg);
    border-radius: 35% 60% 50% 45%;
    opacity: 0.8;
  }
}

@keyframes fl-bottom-1 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(8deg);
    border-radius: 45% 55% 35% 65%;
    opacity: 0.6;
  }
  25% {
    transform: translate(3px, 4px) scaleY(1.5) scaleX(0.6) rotate(15deg);
    border-radius: 35% 65% 30% 70%;
    opacity: 0.9;
  }
  50% {
    transform: translate(-2px, 8px) scaleY(1.2) scaleX(0.7) rotate(5deg);
    border-radius: 55% 45% 35% 65%;
    opacity: 0.5;
  }
  75% {
    transform: translate(1px, 3px) scaleY(1.8) scaleX(0.5) rotate(12deg);
    border-radius: 40% 58% 40% 60%;
    opacity: 0.75;
  }
}

@keyframes fl-bottom-2 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(1) rotate(-10deg);
    border-radius: 60% 40% 40% 60%;
    opacity: 0.55;
  }
  20% {
    transform: translate(-2px, 3px) scaleY(1.4) scaleX(0.65) rotate(-18deg);
    border-radius: 50% 40% 32% 68%;
    opacity: 0.85;
  }
  45% {
    transform: translate(3px, 7px) scaleY(1.1) scaleX(0.75) rotate(-6deg);
    border-radius: 42% 58% 38% 62%;
    opacity: 0.5;
  }
  70% {
    transform: translate(-1px, 5px) scaleY(1.7) scaleX(0.5) rotate(-14deg);
    border-radius: 55% 35% 42% 58%;
    opacity: 0.8;
  }
}

@keyframes fl-bottom-3 {
  0%, 100% {
    transform: translate(0, 0) scaleY(1) scaleX(0.9) rotate(0deg);
    border-radius: 50% 50% 35% 65%;
    opacity: 0.5;
  }
  30% {
    transform: translate(1px, 5px) scaleY(1.3) scaleX(0.6) rotate(6deg);
    border-radius: 38% 62% 30% 70%;
    opacity: 0.8;
  }
  60% {
    transform: translate(-2px, 9px) scaleY(1.0) scaleX(0.7) rotate(-4deg);
    border-radius: 55% 45% 38% 62%;
    opacity: 0.45;
  }
}

@keyframes fl-core {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(129,140,248,0.7)) drop-shadow(0 0 12px rgba(129,140,248,0.35));
  }
  25% {
    filter: drop-shadow(0 0 8px rgba(165,180,252,1)) drop-shadow(0 0 20px rgba(129,140,248,0.6));
  }
  50% {
    filter: drop-shadow(0 0 5px rgba(129,140,248,0.6)) drop-shadow(0 0 14px rgba(129,140,248,0.3));
  }
  75% {
    filter: drop-shadow(0 0 10px rgba(165,180,252,1)) drop-shadow(0 0 24px rgba(129,140,248,0.5));
  }
}
`;

type WispConfig = {
  w: number;
  h: number;
  x: number;
  y: number;
  blur: number;
  anim: string;
  dur: string;
  delay: string;
  color: string;
};

const FlameEffect: React.FC<{ size: "sm" | "md" }> = ({ size }) => {
  const s = size === "sm" ? 0.75 : 1;

  const wisps: WispConfig[] = [
    { w: 7 * s, h: 10 * s, x: -7 * s, y: 2 * s, blur: 2.5 * s, anim: "fl-left-1", dur: "3.4s", delay: "0s", color: "rgba(129,140,248,0.65)" },
    { w: 5 * s, h: 8 * s, x: -9 * s, y: 0, blur: 2 * s, anim: "fl-left-2", dur: "4.1s", delay: "0.7s", color: "rgba(129,140,248,0.5)" },
    { w: 7 * s, h: 10 * s, x: 7 * s, y: 2 * s, blur: 2.5 * s, anim: "fl-right-1", dur: "3.6s", delay: "0.2s", color: "rgba(129,140,248,0.65)" },
    { w: 5 * s, h: 8 * s, x: 9 * s, y: 0, blur: 2 * s, anim: "fl-right-2", dur: "4.3s", delay: "0.9s", color: "rgba(129,140,248,0.5)" },
    { w: 6 * s, h: 10 * s, x: -2 * s, y: -3 * s, blur: 2 * s, anim: "fl-top-1", dur: "3.8s", delay: "0.4s", color: "rgba(165,180,252,0.55)" },
    { w: 5 * s, h: 9 * s, x: 2 * s, y: -3 * s, blur: 2 * s, anim: "fl-top-2", dur: "4.2s", delay: "1.1s", color: "rgba(165,180,252,0.5)" },
    { w: 6 * s, h: 7 * s, x: -4 * s, y: 6 * s, blur: 2 * s, anim: "fl-bottom-1", dur: "3.5s", delay: "0.3s", color: "rgba(129,140,248,0.55)" },
    { w: 6 * s, h: 7 * s, x: 4 * s, y: 6 * s, blur: 2 * s, anim: "fl-bottom-2", dur: "3.8s", delay: "0.6s", color: "rgba(129,140,248,0.55)" },
    { w: 5 * s, h: 6 * s, x: 0, y: 8 * s, blur: 2.5 * s, anim: "fl-bottom-3", dur: "4.0s", delay: "1.0s", color: "rgba(165,180,252,0.45)" },
    { w: 4 * s, h: 5 * s, x: -6 * s, y: 5 * s, blur: 1.8 * s, anim: "fl-bottom-1", dur: "3.2s", delay: "1.3s", color: "rgba(129,140,248,0.4)" },
    { w: 4 * s, h: 5 * s, x: 6 * s, y: 5 * s, blur: 1.8 * s, anim: "fl-bottom-2", dur: "3.4s", delay: "0.1s", color: "rgba(129,140,248,0.4)" },
  ];

  return (
    <>
      {wisps.map((w, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            width: `${w.w}px`,
            height: `${w.h}px`,
            left: `calc(50% - ${w.w / 2}px + ${w.x}px)`,
            top: `calc(50% - ${w.h / 2}px + ${w.y}px)`,
            background: w.color,
            filter: `blur(${w.blur}px)`,
            animation: `${w.anim} ${w.dur} ease-in-out ${w.delay} infinite`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
};

const TierIcon: React.FC<{ tier: number; size: string }> = ({ tier, size }) => {
  const sizeClass = iconSizes[size]?.[tier] || iconSizes["sm"][tier];

  if (tier === 1) {
    return <StarIcon className={`${sizeClass} text-indigo-400`} />;
  }
  if (tier === 2) {
    const containerWidth = size === "sm" ? "w-8" : "w-10";
    const effectSize = size === "sm" ? 32 : 40;
    const s = size === "sm" ? 0.7 : 1;
    const sparks = [
      { x: -6 * s, y: -4 * s, w: 1.5 * s, h: 8 * s, anim: "spark-1", dur: "4s", delay: "0s" },
      { x: 6 * s, y: -2 * s, w: 1.5 * s, h: 7 * s, anim: "spark-2", dur: "4.5s", delay: "0.3s" },
      { x: -4 * s, y: 5 * s, w: 1.5 * s, h: 6 * s, anim: "spark-3", dur: "5s", delay: "0.8s" },
      { x: 5 * s, y: 4 * s, w: 1.5 * s, h: 7 * s, anim: "spark-4", dur: "4.2s", delay: "0.5s" },
      { x: 0, y: -6 * s, w: 1.5 * s, h: 6 * s, anim: "spark-5", dur: "4.8s", delay: "1.2s" },
    ];
    return (
      <span className={`relative inline-flex items-center justify-center ${containerWidth} -mx-2`} style={{ height: 0, overflow: "visible" }}>
        <span className="absolute inline-flex items-center justify-center" style={{ width: effectSize, height: effectSize }}>
          <style dangerouslySetInnerHTML={{ __html: tier2Styles }} />
          {sparks.map((sp, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: `${sp.w}px`,
                height: `${sp.h}px`,
                left: `calc(50% - ${sp.w / 2}px + ${sp.x}px)`,
                top: `calc(50% - ${sp.h / 2}px + ${sp.y}px)`,
                background: `linear-gradient(180deg, transparent 0%, rgba(165,180,252,0.9) 40%, rgba(199,210,254,1) 50%, rgba(165,180,252,0.9) 60%, transparent 100%)`,
                borderRadius: "1px",
                opacity: 0,
                animation: `${sp.anim} ${sp.dur} ease-out ${sp.delay} infinite`,
                pointerEvents: "none",
              }}
            />
          ))}
          <AnimatedShieldIcon
            className={`${sizeClass} relative z-10`}
            style={{ animation: "shield-breathe 3s ease-in-out infinite" }}
          />
        </span>
      </span>
    );
  }
  if (tier === 3) {
    const containerWidth = size === "sm" ? "w-10" : "w-12";
    const effectSize = size === "sm" ? 40 : 48;
    return (
      <span className={`relative inline-flex items-center justify-center ${containerWidth} -mx-3`} style={{ height: 0, overflow: "visible" }}>
        <span className="absolute inline-flex items-center justify-center" style={{ width: effectSize, height: effectSize }}>
          <style dangerouslySetInnerHTML={{ __html: flameStyles }} />
          <FlameEffect size={size as "sm" | "md"} />
          <DiamondIcon
            className={`${sizeClass} text-indigo-200 relative z-10`}
            style={{ animation: "fl-core 4s ease-in-out infinite" }}
          />
        </span>
      </span>
    );
  }
  return null;
};

export const supporterRowClass = (tier: number): string => {
  if (tier === 3) return "bg-indigo-500/[0.06]";
  return "";
};

export const supporterNameStyle = (tier: number): React.CSSProperties | undefined => {
  if (tier === 3) return { color: "#a5b4fc", textShadow: "0 0 8px rgba(129,140,248,0.5), 0 0 16px rgba(129,140,248,0.25)" };
  return undefined;
};

const SupporterBadge: React.FC<SupporterBadgeProps> = ({ tier, size = "sm", showTooltip = true }) => {
  if (tier < 1 || tier > 3) return null;

  const icon = (
    <span className="inline-flex items-center flex-shrink-0">
      <TierIcon tier={tier} size={size} />
    </span>
  );

  if (!showTooltip) return icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center flex-shrink-0 cursor-default">
            <TierIcon tier={tier} size={size} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span>{tierLabels[tier]}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { TierIcon };

export const SUPPORTER_TIERS = [
  { tier: 1, label: "Tier 1", threshold: "$20+", description: "Star icon next to your name" },
  { tier: 2, label: "Tier 2", threshold: "$50+", description: "Animated shield icon next to your name" },
  { tier: 3, label: "Tier 3", threshold: "$100+", description: "Animated diamond icon with highlighted name" },
] as const;

export default SupporterBadge;
