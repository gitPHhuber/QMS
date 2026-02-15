import { useState, useEffect } from 'react';
import api from '../api/client';
import PaymentWidget from '../components/PaymentWidget';

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoiceUrl?: string;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Оплачен', cls: 'bg-status-green/10 text-status-green' },
  pending: { label: 'Ожидание', cls: 'bg-status-yellow/10 text-status-yellow' },
  failed: { label: 'Ошибка', cls: 'bg-status-red/10 text-status-red' },
  refunded: { label: 'Возврат', cls: 'bg-txt-secondary/10 text-txt-secondary' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const { data } = await api.get('/portal/payments');
      setPayments(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-txt-primary">Платежи</h1>
        <button
          onClick={() => setShowWidget(!showWidget)}
          className="px-5 py-2 bg-accent text-dark-bg font-medium rounded-lg
                     hover:bg-accent/90 transition-colors text-sm"
        >
          Привязать карту
        </button>
      </div>

      {/* Payment widget */}
      {showWidget && (
        <div className="mb-6">
          <PaymentWidget />
        </div>
      )}

      {/* Payments table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Дата
                </th>
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Сумма
                </th>
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Статус
                </th>
                <th className="text-right text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Счёт
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-txt-secondary">
                    Загрузка...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-txt-secondary">
                    Платежей пока нет
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const st = statusMap[p.status] || { label: p.status, cls: '' };
                  return (
                    <tr key={p.id} className="hover:bg-dark-border/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-txt-primary">{fmtDate(p.date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-txt-primary">
                        {p.amount.toLocaleString('ru-RU')} &#8381;
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.invoiceUrl ? (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent text-sm hover:underline"
                          >
                            Скачать
                          </a>
                        ) : (
                          <span className="text-txt-secondary text-sm">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
