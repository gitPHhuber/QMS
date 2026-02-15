import React, { useState } from 'react';

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
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.example.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'noreply@asvo.tech' },
      { key: 'smtp_pass', label: 'Password', type: 'password', placeholder: '********' },
    ],
  },
  {
    title: 'Telegram Bot',
    description: 'Telegram bot integration for alert notifications.',
    fields: [
      { key: 'tg_token', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...' },
      { key: 'tg_chat_id', label: 'Chat ID', type: 'text', placeholder: '-1001234567890' },
    ],
  },
  {
    title: 'YuKassa Credentials',
    description: 'Payment gateway credentials for subscription billing.',
    fields: [
      { key: 'yk_shop_id', label: 'Shop ID', type: 'text', placeholder: '12345' },
      { key: 'yk_secret', label: 'Secret Key', type: 'password', placeholder: 'live_...' },
    ],
  },
  {
    title: 'Webhook URLs',
    description: 'External webhook endpoints for event notifications.',
    fields: [
      { key: 'wh_heartbeat', label: 'Heartbeat Webhook', type: 'url', placeholder: 'https://...' },
      { key: 'wh_alert', label: 'Alert Webhook', type: 'url', placeholder: 'https://...' },
      { key: 'wh_payment', label: 'Payment Webhook', type: 'url', placeholder: 'https://...' },
    ],
  },
];

const SettingsPage: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (sectionTitle: string) => {
    // Placeholder: would POST to API
    setSaved(sectionTitle);
    setTimeout(() => setSaved(null), 2000);
  };

  const inputClass =
    'w-full rounded-lg border border-card-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none';

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
              onClick={() => handleSave(section.title)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-hover"
            >
              Save
            </button>
            {saved === section.title && (
              <span className="text-sm text-success">Saved (placeholder)</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettingsPage;
