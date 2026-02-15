import React from 'react';
import type { Payment } from '../store/dashboardStore';

interface PaymentHistoryProps {
  payments: Payment[];
}

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-blue-500/10 text-blue-400',
};

function formatDate(iso: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-card-border bg-card text-text-secondary text-sm">
        No payment history
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border bg-card">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-card-border/50">
              <td className="px-4 py-3 text-text-primary">{formatDate(p.paidAt)}</td>
              <td className="px-4 py-3 text-right font-medium text-text-primary">
                {formatCurrency(p.amount, p.currency)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[p.status] || ''}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {p.invoiceUrl ? (
                  <a
                    href={p.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline text-xs"
                  >
                    View Invoice
                  </a>
                ) : (
                  <span className="text-text-secondary text-xs">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;
