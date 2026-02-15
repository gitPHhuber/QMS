import React, { useState } from 'react';
import type { Organization, Instance } from '../store/dashboardStore';

interface LicenseFormProps {
  organizations: Organization[];
  instances: Instance[];
  onSubmit: (data: LicenseFormData) => void;
  isLoading: boolean;
}

export interface LicenseFormData {
  orgId: string;
  instanceId: string;
  tier: string;
  modules: string[];
  maxUsers: number;
  maxStorageGb: number;
  durationDays: number;
  fingerprint: string;
}

const allModules = [
  'documents',
  'audit',
  'risks',
  'corrective_actions',
  'training',
  'equipment',
  'suppliers',
  'analytics',
  'api_access',
];

const durationOptions = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
];

const tierOptions = ['starter', 'professional', 'enterprise'];

const LicenseForm: React.FC<LicenseFormProps> = ({ organizations, instances, onSubmit, isLoading }) => {
  const [orgId, setOrgId] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [tier, setTier] = useState('professional');
  const [modules, setModules] = useState<string[]>(['documents', 'audit']);
  const [maxUsers, setMaxUsers] = useState(25);
  const [maxStorageGb, setMaxStorageGb] = useState(50);
  const [durationDays, setDurationDays] = useState(365);
  const [fingerprint, setFingerprint] = useState('');

  const filteredInstances = orgId
    ? instances.filter((i) => i.orgId === orgId)
    : instances;

  const toggleModule = (mod: string) => {
    setModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ orgId, instanceId, tier, modules, maxUsers, maxStorageGb, durationDays, fingerprint });
  };

  const inputClass =
    'w-full rounded-lg border border-card-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Organization</label>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={inputClass} required>
          <option value="">Select organization...</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Instance */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Instance</label>
        <select value={instanceId} onChange={(e) => setInstanceId(e.target.value)} className={inputClass} required>
          <option value="">Select instance...</option>
          {filteredInstances.map((i) => (
            <option key={i.id} value={i.id}>{i.hostname}</option>
          ))}
        </select>
      </div>

      {/* Tier */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Tier</label>
        <div className="flex gap-3">
          {tierOptions.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                tier === t
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-card-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={t}
                checked={tier === t}
                onChange={() => setTier(t)}
                className="sr-only"
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Modules</label>
        <div className="grid grid-cols-3 gap-2">
          {allModules.map((mod) => (
            <label
              key={mod}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                modules.includes(mod)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-card-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              <input
                type="checkbox"
                checked={modules.includes(mod)}
                onChange={() => toggleModule(mod)}
                className="sr-only"
              />
              {mod.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </div>

      {/* Max Users & Storage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Max Users</label>
          <input
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Max Storage (GB)</label>
          <input
            type="number"
            min={1}
            value={maxStorageGb}
            onChange={(e) => setMaxStorageGb(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Duration</label>
        <div className="flex gap-3">
          {durationOptions.map((d) => (
            <label
              key={d.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                durationDays === d.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-card-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              <input
                type="radio"
                name="duration"
                value={d.value}
                checked={durationDays === d.value}
                onChange={() => setDurationDays(d.value)}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* Fingerprint */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Hardware Fingerprint</label>
        <input
          type="text"
          value={fingerprint}
          onChange={(e) => setFingerprint(e.target.value)}
          placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          className={inputClass}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-surface transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate License'}
      </button>
    </form>
  );
};

export default LicenseForm;
