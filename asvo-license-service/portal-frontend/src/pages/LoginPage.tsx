import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { portalStore } from '../store/portalStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      portalStore.login(data.token, data.orgId, data.orgName);
      navigate('/subscription', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный код');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent tracking-wide">ASVO-QMS</h1>
          <p className="text-txt-secondary mt-2">Личный кабинет</p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-txt-primary mb-6">Вход</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-status-red/10 border border-status-red/30 text-status-red text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary placeholder-txt-secondary/50 focus:outline-none
                             focus:border-accent transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accent text-dark-bg font-medium rounded-lg
                           hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Отправить код'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-txt-secondary mb-2">
                Код отправлен на <span className="text-accent">{email}</span>
              </p>
              <div>
                <label className="block text-sm text-txt-secondary mb-1.5">Код подтверждения</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary text-center text-2xl tracking-[0.5em] font-mono
                             placeholder-txt-secondary/50 focus:outline-none focus:border-accent
                             transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 bg-accent text-dark-bg font-medium rounded-lg
                           hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Войти'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="w-full py-2 text-sm text-txt-secondary hover:text-accent transition-colors"
              >
                Отправить код повторно
              </button>
            </form>
          )}
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-txt-secondary">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
