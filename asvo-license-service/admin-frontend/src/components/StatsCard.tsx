import React from 'react';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  accent?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, trend, accent }) => {
  const trendColor =
    trend && trend.value > 0
      ? 'text-success'
      : trend && trend.value < 0
        ? 'text-danger'
        : 'text-text-secondary';

  const trendArrow =
    trend && trend.value > 0 ? '\u2191' : trend && trend.value < 0 ? '\u2193' : '';

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trendArrow} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>
          {value}
        </div>
        <div className="mt-1 text-sm text-text-secondary">{label}</div>
      </div>
    </div>
  );
};

export default StatsCard;
