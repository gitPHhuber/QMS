import React from "react";

type BadgeVariant =
  | "nc" | "capa" | "risk" | "audit" | "training" | "sop"
  | "closed" | "product" | "component" | "custom" | "design" | "esign";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  color?: string;
  bg?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  nc:        "bg-[rgba(240,96,96,0.12)] text-[#F06060] border-[#F06060]/30",
  capa:      "bg-[rgba(232,168,48,0.12)] text-[#E8A830] border-[#E8A830]/30",
  risk:      "bg-[rgba(160,106,232,0.12)] text-[#A06AE8] border-[#A06AE8]/30",
  audit:     "bg-[rgba(74,144,232,0.12)] text-[#4A90E8] border-[#4A90E8]/30",
  training:  "bg-[rgba(54,181,224,0.12)] text-[#36B5E0] border-[#36B5E0]/30",
  sop:       "bg-[rgba(45,212,168,0.12)] text-[#2DD4A8] border-[#2DD4A8]/30",
  closed:    "bg-[rgba(58,78,98,0.15)] text-[#3A4E62] border-[#3A4E62]/30",
  product:   "bg-[rgba(224,104,144,0.12)] text-[#E06890] border-[#E06890]/30",
  component: "bg-[rgba(58,78,98,0.15)] text-[#8899AB] border-[#3A4E62]/30",
  design:    "bg-[rgba(232,144,48,0.12)] text-[#E89030] border-[#E89030]/30",
  esign:     "bg-[rgba(100,180,232,0.12)] text-[#64B4E8] border-[#64B4E8]/30",
};

const Badge: React.FC<BadgeProps> = ({ variant = "closed", children, color, bg }) => {
  const cls = VARIANT_STYLES[variant] || VARIANT_STYLES.closed;
  return (
    <span
      className={`inline-flex items-center rounded-xl text-[11px] font-semibold px-2.5 py-0.5 leading-none ${!color ? cls : ""}`}
      style={color ? { backgroundColor: bg || `${color}22`, color } : undefined}
    >
      {children}
    </span>
  );
};

export default Badge;
