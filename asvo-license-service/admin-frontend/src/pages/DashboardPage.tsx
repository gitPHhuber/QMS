import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { useDashboardStats } from '../store/dashboardStore';

const TIER_COLORS = ['#3B82F6', '#2DD4A8', '#A855F7', '#F59E0B'];

function formatCurrency(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

const severityColors: Record<string, string> = {
  critical: 'text-danger',
  warning: 'text-warning',
  info: 'text-accent',
};

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-secondary">
        Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-64 items-center justify-center text-danger">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          icon={'\u{1F4B0}'}
          label="Monthly Recurring Revenue"
          value={formatCurrency(stats.mrr)}
          accent
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatsCard
          icon={'\u{1F4C8}'}
          label="Annual Recurring Revenue"
          value={formatCurrency(stats.arr)}
        />
        <StatsCard
          icon={'\u{1F3E2}'}
          label="Active Organizations"
          value={stats.activeOrgs}
          trend={{ value: 3, label: 'new' }}
        />
        <StatsCard
          icon={'\u{1F5A5}'}
          label="Online Instances"
          value={`${stats.onlineInstances}/${stats.totalInstances}`}
        />
        <StatsCard
          icon={'\u{1F514}'}
          label="Active Alerts"
          value={stats.alerts}
        />
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tier Distribution */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-text-secondary">Tier Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.tierDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {stats.tierDistribution.map((_, idx) => (
                  <Cell key={idx} fill={TIER_COLORS[idx % TIER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1A2E',
                  border: '1px solid #1E2D45',
                  borderRadius: 8,
                  color: '#E2E8F0',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {stats.tierDistribution.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[idx % TIER_COLORS.length] }}
                />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-text-secondary">Recent Alerts</h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {stats.recentAlerts.length === 0 && (
              <div className="py-8 text-center text-text-secondary text-sm">No recent alerts</div>
            )}
            {stats.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border border-card-border/50 px-3 py-2.5"
              >
                <span className={`mt-0.5 text-xs font-semibold uppercase ${severityColors[alert.severity]}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{alert.message}</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {alert.orgName} &middot;{' '}
                    {new Date(alert.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
