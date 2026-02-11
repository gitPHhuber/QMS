import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = "text-asvo-accent" }) => {
  return (
    <div className="bg-asvo-card border border-asvo-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="text-asvo-text-dim">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-asvo-text-dim uppercase mt-1">{label}</div>
    </div>
  );
};

export default StatCard;
