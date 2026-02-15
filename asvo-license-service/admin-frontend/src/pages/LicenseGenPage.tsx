import React, { useState } from 'react';
import LicenseForm from '../components/LicenseForm';
import type { LicenseFormData } from '../components/LicenseForm';
import { useOrganizations, useInstances } from '../store/dashboardStore';
import apiClient from '../api/client';

interface GeneratedLicense {
  id: string;
  licenseKey: string;
  expiresAt: string;
}

const LicenseGenPage: React.FC = () => {
  const { data: orgsData } = useOrganizations({ limit: 500 });
  const { data: instances } = useInstances();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedLicense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: LicenseFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await apiClient.post('/licenses', formData);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate license');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.licenseKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${result.id}.key`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Generate License</h1>

      <div className="rounded-xl border border-card-border bg-card p-6">
        <LicenseForm
          organizations={orgsData?.items || []}
          instances={instances || []}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-accent">License Generated Successfully</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">License ID</span>
              <span className="font-mono text-text-primary">{result.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Expires</span>
              <span className="text-text-primary">
                {new Date(result.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">License Key</label>
            <pre className="overflow-x-auto rounded-lg border border-card-border bg-surface p-3 text-xs text-text-primary">
              {result.licenseKey}
            </pre>
          </div>
          <button
            onClick={handleDownload}
            className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            Download .key File
          </button>
        </div>
      )}
    </div>
  );
};

export default LicenseGenPage;
