import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface SettingsSection {
  title: string;
  description: string;
  fields: { key: string; label: string; type: string; placeholder: string }[];
}

const sections: SettingsSection[] = [
  {
    title: 'SMTP Configuration',
    description: 'Email server settings for sending notifications and license delivery.',
    fields: [
      { key: 'smtp.host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.example.com' },
      { key: 'smtp.port', label: 'SMTP Port', type: 'number', placeholder: '587' },
      { key: 'smtp.user', label: 'Username', type: 'text', placeholder: 'noreply@asvo.tech' },
      { key: 'smtp.pass', label: 'Password', type: 'password', placeholder: '********' },
    ],
  },
  {
    title: 'Telegram Bot',
    description: 'Telegram bot integration for alert notifications.',
    fields: [
      { key: 'telegram.token', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...' },
      { key: 'telegram.chat_id', label: 'Chat ID', type: 'text', placeholder: '-1001234567890' },
    ],
  },
  {
    title: 'YuKassa Credentials',
    description: 'Payment gateway credentials for subscription billing.',
    fields: [
      { key: 'yukassa.shop_id', label: 'Shop ID', type: 'text', placeholder: '12345' },
      { key: 'yukassa.secret', label: 'Secret Key', type: 'password', placeholder: 'live_...' },
    ],
  },
  {
    title: 'Webhook URLs',
    description: 'External webhook endpoints for event notifications.',
    fields: [
      { key: 'webhook.heartbeat', label: 'Heartbeat Webhook', type: 'url', placeholder: 'https://...' },
      { key: 'webhook.alert', label: 'Alert Webhook', type: 'url', placeholder: 'https://...' },
      { key: 'webhook.payment', label: 'Payment Webhook', type: 'url', placeholder: 'https://...' },
    ],
  },
];

const SettingsPage: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<{ section: string; type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/settings').then(({ data }) => {
      const flat: Record<string, string> = {};
      for (const [section, fields] of Object.entries(data as Record<string, Record<string, string>>)) {
        for (const [field, value] of Object.entries(fields)) {
          flat[`${section}.${field}`] = value;
        }
      }
      setValues(flat);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (section: SettingsSection) => {
    setSaving(section.title);
    setStatus(null);
    try {
      const payload: Record<string, string> = {};
      for (const field of section.fields) {
        if (values[field.key] !== undefined && values[field.key] !== '') {
          payload[field.key] = values[field.key];
        }
      }
      await apiClient.put('/settings', payload);
      setStatus({ section: section.title, type: 'success', text: 'Saved' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ section: section.title, type: 'error', text: err?.response?.data?.error || 'Save failed' });
    } finally {
      setSaving(null);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-card-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none';

  if (loading) {
    return <div className="mx-auto max-w-2xl p-8 text-text-secondary">Loading settings...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-text-primary">Settings</h1>

      {sections.map((section) => (
        <div key={section.title} className="rounded-xl border border-card-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-medium text-text-primary">{section.title}</h2>
            <p className="mt-0.5 text-sm text-text-secondary">{section.description}</p>
          </div>

          <div className="space-y-3">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={values[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(section)}
              disabled={saving === section.title}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving === section.title ? 'Saving...' : 'Save'}
            </button>
            {status?.section === section.title && (
              <span className={`text-sm ${status.type === 'success' ? 'text-success' : 'text-red-400'}`}>
                {status.text}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettingsPage;
