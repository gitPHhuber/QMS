import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import TierCard, { TIER_PRESETS } from '../components/TierCard';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgName: '',
    inn: '',
    email: '',
    contactName: '',
    phone: '',
  });
  const [selectedTier, setSelectedTier] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function upd(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        orgName: form.orgName,
        inn: form.inn,
        email: form.email,
        contactName: form.contactName,
        phone: form.phone || undefined,
        tier: selectedTier,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4 text-status-green">&#10003;</div>
          <h2 className="text-2xl font-semibold text-txt-primary mb-3">Регистрация завершена!</h2>
          <p className="text-txt-secondary mb-6">
            Пробный период на 14 дней активирован. Проверьте почту для входа.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-accent text-dark-bg font-medium rounded-lg
                       hover:bg-accent/90 transition-colors"
          >
            Перейти ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent tracking-wide">ASVO-QMS</h1>
          <p className="text-txt-secondary mt-2">Регистрация организации</p>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 p-3 rounded-lg bg-status-red/10 border border-status-red/30 text-status-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Org info */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 mb-8 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-txt-primary mb-5">Данные организации</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Название организации *</label>
                <input
                  type="text"
                  value={form.orgName}
                  onChange={upd('orgName')}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">ИНН *</label>
                <input
                  type="text"
                  value={form.inn}
                  onChange={upd('inn')}
                  required
                  maxLength={12}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary font-mono focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={upd('email')}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Контактное лицо *</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={upd('contactName')}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={upd('phone')}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary placeholder-txt-secondary/50 focus:outline-none
                             focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tier selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-txt-primary mb-5 text-center">
              Выберите тарифный план
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TIER_PRESETS.map((tier) => (
                <TierCard
                  key={tier.key}
                  tier={tier}
                  selected={selectedTier === tier.key}
                  onSelect={setSelectedTier}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-accent text-dark-bg font-semibold rounded-lg text-lg
                         hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Начать пробный период (14 дней)'}
            </button>
            <p className="mt-4 text-sm text-txt-secondary">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-accent hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
