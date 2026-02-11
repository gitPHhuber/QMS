import React from "react";

type DotColor = "red" | "amber" | "accent" | "purple" | "blue" | "grey" | "orange" | "green";

interface StatusDotProps {
  color: DotColor;
  className?: string;
}

const COLOR_MAP: Record<DotColor, { bg: string; shadow: string }> = {
  red:    { bg: "bg-[#F06060]", shadow: "shadow-[0_0_6px_rgba(240,96,96,0.4)]" },
  amber:  { bg: "bg-[#E8A830]", shadow: "shadow-[0_0_6px_rgba(232,168,48,0.4)]" },
  accent: { bg: "bg-[#2DD4A8]", shadow: "shadow-[0_0_6px_rgba(45,212,168,0.4)]" },
  green:  { bg: "bg-[#2DD4A8]", shadow: "shadow-[0_0_6px_rgba(45,212,168,0.4)]" },
  purple: { bg: "bg-[#A06AE8]", shadow: "shadow-[0_0_6px_rgba(160,106,232,0.4)]" },
  blue:   { bg: "bg-[#4A90E8]", shadow: "shadow-[0_0_6px_rgba(74,144,232,0.4)]" },
  grey:   { bg: "bg-[#3A4E62]", shadow: "shadow-[0_0_6px_rgba(58,78,98,0.4)]" },
  orange: { bg: "bg-[#E87040]", shadow: "shadow-[0_0_6px_rgba(232,112,64,0.4)]" },
};

const StatusDot: React.FC<StatusDotProps> = ({ color, className = "" }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.grey;
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${c.bg} ${c.shadow} ${className}`} />
  );
};

export default StatusDot;
