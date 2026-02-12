import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = "#2DD4A8" }) => (
  <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span style={{ color }} className="opacity-70">{icon}</span>}
    </div>
    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    <div className="text-xs text-asvo-text-dim mt-1">{label}</div>
  </div>
);

export default StatCard;
