import React from "react";

type BarColor = "accent" | "amber" | "red" | "blue" | "purple" | "green";

interface ProgressBarProps {
  value: number;
  color?: BarColor;
}

const GRADIENT_MAP: Record<BarColor, string> = {
  accent: "from-[#2DD4A8]/50 to-[#2DD4A8]",
  green:  "from-[#2DD4A8]/50 to-[#2DD4A8]",
  amber:  "from-[#E8A830]/50 to-[#E8A830]",
  red:    "from-[#F06060]/50 to-[#F06060]",
  blue:   "from-[#4A90E8]/50 to-[#4A90E8]",
  purple: "from-[#A06AE8]/50 to-[#A06AE8]",
};

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = "accent" }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1 bg-asvo-bg rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${GRADIENT_MAP[color] || GRADIENT_MAP.accent} transition-all duration-300`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default ProgressBar;
