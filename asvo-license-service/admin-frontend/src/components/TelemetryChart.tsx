import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TelemetryPoint } from '../store/dashboardStore';

interface TelemetryChartProps {
  data: TelemetryPoint[];
}

function formatTick(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TelemetryChart: React.FC<TelemetryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-card-border bg-card text-text-secondary">
        No telemetry data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">Telemetry Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
          <XAxis
            dataKey="ts"
            tickFormatter={formatTick}
            stroke="#94A3B8"
            fontSize={12}
          />
          <YAxis stroke="#94A3B8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F1A2E',
              border: '1px solid #1E2D45',
              borderRadius: 8,
              color: '#E2E8F0',
              fontSize: 12,
            }}
            labelFormatter={formatTick}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#2DD4A8"
            strokeWidth={2}
            dot={false}
            name="Active Users"
          />
          <Line
            type="monotone"
            dataKey="storageGb"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Storage (GB)"
          />
          <Line
            type="monotone"
            dataKey="errors"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Errors"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TelemetryChart;
