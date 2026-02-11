import React from "react";
import StatCard from "./StatCard";

interface KpiItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

interface KpiRowProps {
  items: KpiItem[];
}

const KpiRow: React.FC<KpiRowProps> = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
    {items.map((item, i) => (
      <StatCard key={i} label={item.label} value={item.value} icon={item.icon} color={item.color} />
    ))}
  </div>
);

export default KpiRow;
