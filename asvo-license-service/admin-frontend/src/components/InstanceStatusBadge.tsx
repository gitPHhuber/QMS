import React from 'react';

interface InstanceStatusBadgeProps {
  status: 'online' | 'offline' | 'degraded';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  online: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Online',
  },
  offline: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    dot: 'bg-danger',
    label: 'Offline',
  },
  degraded: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Degraded',
  },
};

const InstanceStatusBadge: React.FC<InstanceStatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.offline;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export default InstanceStatusBadge;
