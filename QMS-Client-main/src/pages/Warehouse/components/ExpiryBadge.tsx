import React from "react";
import { Clock } from "lucide-react";

interface ExpiryBadgeProps {
  expiryDate: string | null;
}

export const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiryDate }) => {
  if (!expiryDate) return <span className="text-asvo-text-dim text-xs">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let color: string;
  let label: string;

  if (diffDays < 0) {
    color = "bg-asvo-red text-white";
    label = "Просрочен";
  } else if (diffDays <= 30) {
    color = "bg-asvo-red-dim text-asvo-red";
    label = `${diffDays} дн.`;
  } else if (diffDays <= 90) {
    color = "bg-asvo-amber-dim text-asvo-amber";
    label = `${diffDays} дн.`;
  } else {
    color = "bg-asvo-green-dim text-asvo-green";
    label = expiryDate;
  }

  return (
    <span className={`${color} px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1`}>
      <Clock size={10} />
      {label}
    </span>
  );
};
