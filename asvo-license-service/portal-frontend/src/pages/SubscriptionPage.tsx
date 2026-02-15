import { useState, useEffect } from 'react';
import api from '../api/client';
import TierCard, { TIER_PRESETS, TierPreset } from '../components/TierCard';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  price: number;
  autoRenew: boolean;
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  trialing: { label: 'Пробный период', cls: 'bg-status-yellow/10 text-status-yellow' },
  active: { label: 'Активна', cls: 'bg-status-green/10 text-status-green' },
  past_due: { label: 'Просрочена', cls: 'bg-status-red/10 text-status-red' },
  cancelled: { label: 'Отменена', cls: 'bg-txt-secondary/10 text-txt-secondary' },
  suspended: { label: 'Приостановлена', cls: 'bg-status-yellow/10 text-status-yellow' },
};

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const { data } = await api.get('/portal/subscription');
      setSub(data);
      setSelectedTier(data.tier);
    } catch {
      // no subscription yet
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeTier() {
    if (!selectedTier || selectedTier === sub?.tier) return;
    setChanging(true);
    try {
      await api.put('/portal/subscription/tier', { tier: selectedTier });
      setShowModal(false);
      await fetchSubscription();
    } catch {
      // error
    } finally {
      setChanging(false);
    }
  }

  async function handleCancelAutoRenew() {
    try {
      await api.post('/portal/subscription/cancel-auto-renew');
      await fetchSubscription();
    } catch {
      // error
    }
  }

  async function handleActivate() {
    try {
      await api.post('/portal/subscription/activate');
      await fetchSubscription();
    } catch {
      // error
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const currentTier = TIER_PRESETS.find((t) => t.key === sub?.tier);
  const st = sub ? statusLabels[sub.status] || { label: sub.status, cls: '' } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-txt-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-txt-primary mb-6">Подписка</h1>

      {sub ? (
        <div className="space-y-6">
          {/* Current plan card */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold text-txt-primary">
                    {currentTier?.name || sub.tier}
                  </h2>
                  {st && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                      {st.label}
                    </span>
                  )}
                </div>
                <p className="text-txt-secondary text-sm">
                  {fmtDate(sub.periodStart)} &mdash; {fmtDate(sub.periodEnd)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent">
                  {sub.price.toLocaleString('ru-RU')} &#8381;
                </div>
                <div className="text-xs text-txt-secondary">/ мес</div>
              </div>
            </div>

            {/* Details */}
            {currentTier && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-txt-primary">
                    {currentTier.maxUsers === -1 ? '\u221E' : currentTier.maxUsers}
                  </div>
                  <div className="text-xs text-txt-secondary">Пользователей</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-txt-primary">
                    {currentTier.maxStorageGb === -1 ? '\u221E' : currentTier.maxStorageGb} Гб
                  </div>
                  <div className="text-xs text-txt-secondary">Хранилище</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-txt-primary">
                    {currentTier.modulesCount}
                  </div>
                  <div className="text-xs text-txt-secondary">Модулей</div>
                </div>
              </div>
            )}

            {/* Auto-renew info */}
            <div className="flex items-center gap-2 text-sm text-txt-secondary mb-6">
              <span
                className={`w-2 h-2 rounded-full ${
                  sub.autoRenew ? 'bg-status-green' : 'bg-txt-secondary'
                }`}
              />
              Автопродление: {sub.autoRenew ? 'включено' : 'отключено'}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2 bg-accent text-dark-bg font-medium rounded-lg
                           hover:bg-accent/90 transition-colors text-sm"
              >
                Сменить тариф
              </button>

              {sub.status === 'trialing' && (
                <button
                  onClick={handleActivate}
                  className="px-5 py-2 bg-status-green text-white font-medium rounded-lg
                             hover:bg-status-green/90 transition-colors text-sm"
                >
                  Оплатить и активировать
                </button>
              )}

              {sub.autoRenew && sub.status !== 'cancelled' && (
                <button
                  onClick={handleCancelAutoRenew}
                  className="px-5 py-2 border border-dark-border text-txt-secondary rounded-lg
                             hover:text-status-red hover:border-status-red/50 transition-colors text-sm"
                >
                  Отменить автопродление
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-txt-secondary">
          Подписка не найдена. Обратитесь в поддержку.
        </div>
      )}

      {/* Change tier modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-txt-primary">Выберите тарифный план</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-txt-secondary hover:text-txt-primary transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {TIER_PRESETS.map((tier) => (
                <TierCard
                  key={tier.key}
                  tier={tier}
                  selected={selectedTier === tier.key}
                  onSelect={setSelectedTier}
                />
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 border border-dark-border text-txt-secondary rounded-lg
                           hover:text-txt-primary transition-colors text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleChangeTier}
                disabled={changing || selectedTier === sub?.tier}
                className="px-6 py-2 bg-accent text-dark-bg font-medium rounded-lg
                           hover:bg-accent/90 transition-colors text-sm disabled:opacity-50"
              >
                {changing ? 'Применяем...' : 'Применить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
