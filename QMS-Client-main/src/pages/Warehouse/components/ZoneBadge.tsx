import React from "react";

const ZONE_COLORS: Record<string, string> = {
  INCOMING: "bg-asvo-blue-dim text-asvo-blue",
  QUARANTINE: "bg-asvo-amber-dim text-asvo-amber",
  MAIN: "bg-asvo-green-dim text-asvo-green",
  FINISHED_GOODS: "bg-asvo-purple-dim text-asvo-purple",
  DEFECT: "bg-asvo-red-dim text-asvo-red",
  SHIPPING: "bg-asvo-accent-dim text-asvo-accent",
};

const ZONE_LABELS: Record<string, string> = {
  INCOMING: "Приёмка",
  QUARANTINE: "Карантин",
  MAIN: "Основной",
  FINISHED_GOODS: "Гот. продукция",
  DEFECT: "Брак",
  SHIPPING: "Отгрузка",
};

interface ZoneBadgeProps {
  type: string;
  name?: string;
  size?: "sm" | "md";
}

export const ZoneBadge: React.FC<ZoneBadgeProps> = ({ type, name, size = "sm" }) => {
  const color = ZONE_COLORS[type] || "bg-asvo-surface-2 text-asvo-text-mid";
  const label = name || ZONE_LABELS[type] || type;
  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  return (
    <span className={`${color} ${sizeClass} rounded font-bold inline-block whitespace-nowrap`}>
      {label}
    </span>
  );
};
