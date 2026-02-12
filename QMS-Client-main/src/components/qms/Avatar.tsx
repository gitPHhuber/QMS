import React from "react";

type AvatarSize = "sm" | "md" | "lg";
type AvatarColor = "accent" | "blue" | "purple" | "amber" | "red" | "green" | "orange";

interface AvatarProps {
  name: string;
  color?: AvatarColor;
  size?: AvatarSize;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "w-6 h-6", text: "text-[9px]" },
  md: { container: "w-7 h-7", text: "text-[10px]" },
  lg: { container: "w-9 h-9", text: "text-[12px]" },
};

const COLOR_MAP: Record<AvatarColor, { bg: string; border: string; text: string }> = {
  accent: { bg: "bg-[#2DD4A8]/15", border: "border-[#2DD4A8]/35", text: "text-[#2DD4A8]" },
  blue:   { bg: "bg-[#4A90E8]/15", border: "border-[#4A90E8]/35", text: "text-[#4A90E8]" },
  purple: { bg: "bg-[#A06AE8]/15", border: "border-[#A06AE8]/35", text: "text-[#A06AE8]" },
  amber:  { bg: "bg-[#E8A830]/15", border: "border-[#E8A830]/35", text: "text-[#E8A830]" },
  red:    { bg: "bg-[#F06060]/15", border: "border-[#F06060]/35", text: "text-[#F06060]" },
  green:  { bg: "bg-[#2DD4A8]/15", border: "border-[#2DD4A8]/35", text: "text-[#2DD4A8]" },
  orange: { bg: "bg-[#E87040]/15", border: "border-[#E87040]/35", text: "text-[#E87040]" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return (parts[0]?.[0] || "?").toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({ name, color = "accent", size = "sm" }) => {
  const s = SIZE_MAP[size];
  const c = COLOR_MAP[color] || COLOR_MAP.accent;

  return (
    <div
      className={`${s.container} rounded-full ${c.bg} border-[1.5px] ${c.border} flex items-center justify-center shrink-0`}
      title={name}
    >
      <span className={`${s.text} ${c.text} font-bold leading-none`}>
        {getInitials(name)}
      </span>
    </div>
  );
};

export default Avatar;
