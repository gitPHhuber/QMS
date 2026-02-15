import React, { useState } from 'react';
import OrgTable from '../components/OrgTable';
import { useOrganizations } from '../store/dashboardStore';

const PAGE_SIZE = 20;

const OrganizationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useOrganizations({
    search: search || undefined,
    tier: tier || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const organizations = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inputClass =
    'rounded-lg border border-card-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Organizations</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or INN..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={`${inputClass} w-64`}
        />
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All Tiers</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
        </select>
        <span className="ml-auto text-sm text-text-secondary">
          {total} organization{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-secondary">Loading...</div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center text-danger">Failed to load organizations</div>
      ) : (
        <OrgTable organizations={organizations} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-card-border/30 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-card-border/30 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;
