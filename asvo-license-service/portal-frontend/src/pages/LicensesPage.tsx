import { useState, useEffect } from 'react';
import api from '../api/client';

interface License {
  id: string;
  tier: string;
  modulesCount: number;
  validUntil: string;
  status: string;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: 'Активна', cls: 'bg-status-green/10 text-status-green' },
  expired: { label: 'Истекла', cls: 'bg-status-red/10 text-status-red' },
  revoked: { label: 'Отозвана', cls: 'bg-txt-secondary/10 text-txt-secondary' },
  pending: { label: 'Ожидание', cls: 'bg-status-yellow/10 text-status-yellow' },
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReissue, setShowReissue] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState('');
  const [reissuing, setReissuing] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  async function fetchLicenses() {
    try {
      const { data } = await api.get('/portal/licenses');
      setLicenses(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(licenseId: string) {
    try {
      const { data } = await api.get(`/portal/licenses/${licenseId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${licenseId}.lic`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // error
    }
  }

  async function handleReissue(licenseId: string) {
    if (!fingerprint.trim()) return;
    setReissuing(true);
    try {
      await api.post(`/portal/licenses/${licenseId}/reissue`, {
        fingerprint: fingerprint.trim(),
      });
      setShowReissue(null);
      setFingerprint('');
      await fetchLicenses();
    } catch {
      // error
    } finally {
      setReissuing(false);
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
      <h1 className="text-2xl font-bold text-txt-primary mb-6">Лицензии</h1>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Тариф
                </th>
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Модулей
                </th>
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Действительна до
                </th>
                <th className="text-left text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Статус
                </th>
                <th className="text-right text-xs text-txt-secondary font-medium uppercase tracking-wider px-6 py-4">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-txt-secondary">
                    Загрузка...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-txt-secondary">
                    Лицензий пока нет
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => {
                  const st = statusMap[lic.status] || { label: lic.status, cls: '' };
                  return (
                    <tr key={lic.id} className="hover:bg-dark-border/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-txt-primary capitalize">
                        {lic.tier}
                      </td>
                      <td className="px-6 py-4 text-sm text-txt-primary">{lic.modulesCount}</td>
                      <td className="px-6 py-4 text-sm text-txt-primary">
                        {fmtDate(lic.validUntil)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(lic.id)}
                            className="text-accent text-sm hover:underline"
                          >
                            Скачать .lic
                          </button>
                          <button
                            onClick={() => setShowReissue(lic.id)}
                            className="text-txt-secondary text-sm hover:text-accent transition-colors"
                          >
                            Перевыпустить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reissue modal */}
      {showReissue && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-txt-primary mb-4">Перевыпуск лицензии</h2>
            <p className="text-sm text-txt-secondary mb-4">
              Введите fingerprint нового сервера для привязки лицензии.
            </p>
            <input
              type="text"
              value={fingerprint}
              onChange={(e) => setFingerprint(e.target.value)}
              placeholder="server-fingerprint-hash"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                         text-txt-primary font-mono text-sm placeholder-txt-secondary/50
                         focus:outline-none focus:border-accent transition-colors mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReissue(null);
                  setFingerprint('');
                }}
                className="px-4 py-2 border border-dark-border text-txt-secondary rounded-lg
                           hover:text-txt-primary transition-colors text-sm"
              >
                Отмена
              </button>
              <button
                onClick={() => handleReissue(showReissue)}
                disabled={reissuing || !fingerprint.trim()}
                className="px-5 py-2 bg-accent text-dark-bg font-medium rounded-lg
                           hover:bg-accent/90 transition-colors text-sm disabled:opacity-50"
              >
                {reissuing ? 'Перевыпуск...' : 'Перевыпустить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
