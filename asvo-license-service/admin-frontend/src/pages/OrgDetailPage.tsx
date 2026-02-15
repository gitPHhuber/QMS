import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useOrganization,
  useInstances,
  useLicenses,
  usePayments,
  useTelemetry,
  useAuditLog,
} from '../store/dashboardStore';
import InstanceStatusBadge from '../components/InstanceStatusBadge';
import TelemetryChart from '../components/TelemetryChart';
import PaymentHistory from '../components/PaymentHistory';

const tabs = ['Overview', 'Instances', 'Licenses', 'Payments', 'Telemetry', 'Audit'] as const;
type Tab = (typeof tabs)[number];

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

const OrgDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedInstanceId, setSelectedInstanceId] = useState('');

  const { data: org, isLoading: orgLoading } = useOrganization(id || '');
  const { data: instances } = useInstances({ orgId: id });
  const { data: licenses } = useLicenses(id || '');
  const { data: payments } = usePayments(id || '');
  const { data: telemetry } = useTelemetry(selectedInstanceId);
  const { data: auditLog } = useAuditLog(id || '');

  if (orgLoading) {
    return <div className="flex h-64 items-center justify-center text-text-secondary">Loading...</div>;
  }

  if (!org) {
    return <div className="flex h-64 items-center justify-center text-danger">Organization not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{org.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            <span>INN: {org.inn}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[org.tier] || ''}`}>
              {org.tier}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[org.status] || ''}`}>
              {org.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-card-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard label="Instances" value={String(org.instanceCount)} />
          <InfoCard label="MRR" value={`$${org.mrr.toLocaleString()}`} />
          <InfoCard
            label="Last Heartbeat"
            value={org.lastHeartbeat ? new Date(org.lastHeartbeat).toLocaleString() : '--'}
          />
        </div>
      )}

      {activeTab === 'Instances' && (
        <div className="overflow-x-auto rounded-xl border border-card-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Hostname</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Version</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Users</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Storage</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {(instances || []).map((inst) => (
                <tr key={inst.id} className="border-b border-card-border/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{inst.hostname}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{inst.version}</td>
                  <td className="px-4 py-3">
                    <InstanceStatusBadge status={inst.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">{inst.userCount}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{inst.storageUsedGb} GB</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(inst.lastHeartbeat).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!instances || instances.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No instances
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Licenses' && (
        <div className="overflow-x-auto rounded-xl border border-card-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Modules</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Max Users</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Issued</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Expires</th>
              </tr>
            </thead>
            <tbody>
              {(licenses || []).map((lic) => (
                <tr key={lic.id} className="border-b border-card-border/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{lic.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[lic.tier] || 'text-text-secondary'}`}>
                      {lic.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {lic.modules.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">{lic.maxUsers}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(lic.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(lic.expiresAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!licenses || licenses.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No licenses issued
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Payments' && <PaymentHistory payments={payments || []} />}

      {activeTab === 'Telemetry' && (
        <div className="space-y-4">
          <select
            value={selectedInstanceId}
            onChange={(e) => setSelectedInstanceId(e.target.value)}
            className="rounded-lg border border-card-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">Select instance...</option>
            {(instances || []).map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.hostname}</option>
            ))}
          </select>
          {selectedInstanceId && <TelemetryChart data={telemetry || []} />}
        </div>
      )}

      {activeTab === 'Audit' && (
        <div className="space-y-2">
          {(auditLog || []).length === 0 && (
            <div className="flex h-32 items-center justify-center rounded-xl border border-card-border bg-card text-text-secondary text-sm">
              No audit entries
            </div>
          )}
          {(auditLog || []).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-card-border/50 bg-card px-4 py-3"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{entry.action}</div>
                <div className="mt-0.5 text-xs text-text-secondary">{entry.details}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-accent">{entry.actor}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Helper sub-component */
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-1 text-lg font-semibold text-text-primary">{value}</div>
    </div>
  );
}

export default OrgDetailPage;
