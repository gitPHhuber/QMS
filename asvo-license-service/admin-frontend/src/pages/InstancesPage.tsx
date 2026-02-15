import React from 'react';
import { useInstances } from '../store/dashboardStore';
import InstanceStatusBadge from '../components/InstanceStatusBadge';

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function heartbeatColor(iso: string): string {
  const h = hoursAgo(iso);
  if (h < 2) return 'text-success';
  if (h < 24) return 'text-warning';
  return 'text-danger';
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const InstancesPage: React.FC = () => {
  const { data: instances, isLoading, error } = useInstances();

  const sorted = [...(instances || [])].sort(
    (a, b) => new Date(a.lastHeartbeat).getTime() - new Date(b.lastHeartbeat).getTime(),
  );

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-text-secondary">Loading instances...</div>;
  }

  if (error) {
    return <div className="flex h-64 items-center justify-center text-danger">Failed to load instances</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">All Instances</h1>
        <span className="text-sm text-text-secondary">{sorted.length} instance{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="text-xs text-text-secondary flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> &lt; 2 hours ago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> 2 - 24 hours ago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" /> &gt; 24 hours ago
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-card-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Hostname</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Organization</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Version</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Users</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Storage (GB)</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inst) => (
              <tr key={inst.id} className="border-b border-card-border/50 transition-colors hover:bg-card-border/20">
                <td className="px-4 py-3 font-medium text-text-primary">{inst.hostname}</td>
                <td className="px-4 py-3 text-text-secondary">{inst.orgName}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{inst.version}</td>
                <td className="px-4 py-3">
                  <InstanceStatusBadge status={inst.status} />
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">{inst.userCount}</td>
                <td className="px-4 py-3 text-right text-text-secondary">{inst.storageUsedGb}</td>
                <td className={`px-4 py-3 text-xs font-medium ${heartbeatColor(inst.lastHeartbeat)}`}>
                  {formatDate(inst.lastHeartbeat)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No instances found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstancesPage;
