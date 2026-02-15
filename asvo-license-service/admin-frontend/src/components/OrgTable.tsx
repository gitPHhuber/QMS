import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Organization } from '../store/dashboardStore';

interface OrgTableProps {
  organizations: Organization[];
}

const tierColors: Record<string, string> = {
  starter: 'bg-blue-500/10 text-blue-400',
  professional: 'bg-accent/10 text-accent',
  enterprise: 'bg-purple-500/10 text-purple-400',
};

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-danger/10 text-danger',
  trial: 'bg-warning/10 text-warning',
};

function formatDate(iso: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const OrgTable: React.FC<OrgTableProps> = ({ organizations }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border bg-card">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">INN</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Tier</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Instances</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Heartbeat</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">MRR</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr
              key={org.id}
              onClick={() => navigate(`/orgs/${org.id}`)}
              className="cursor-pointer border-b border-card-border/50 transition-colors hover:bg-card-border/20"
            >
              <td className="px-4 py-3 font-medium text-text-primary">{org.name}</td>
              <td className="px-4 py-3 text-text-secondary font-mono text-xs">{org.inn}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tierColors[org.tier] || ''}`}>
                  {org.tier}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[org.status] || ''}`}>
                  {org.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">{org.instanceCount}</td>
              <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(org.lastHeartbeat)}</td>
              <td className="px-4 py-3 text-right font-medium text-text-primary">
                {formatCurrency(org.mrr)}
              </td>
            </tr>
          ))}
          {organizations.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                No organizations found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrgTable;
