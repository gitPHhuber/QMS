import { useState, FormEvent } from 'react';
import api from '../api/client';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Как работает пробный период?',
    a: 'После регистрации вы получаете 14 дней полного доступа к выбранному тарифу. Оплата не требуется. По истечении пробного периода необходимо оплатить подписку для продолжения работы.',
  },
  {
    q: 'Как привязать лицензию к серверу?',
    a: 'При первом запуске QMS-сервера система автоматически генерирует fingerprint и отправляет его в лицензионный сервис. Лицензия привязывается к fingerprint сервера. При смене сервера необходимо перевыпустить лицензию в разделе "Лицензии".',
  },
  {
    q: 'Можно ли сменить тарифный план?',
    a: 'Да, вы можете изменить тариф в любой момент в разделе "Подписка". При повышении тарифа разница будет списана пропорционально оставшимся дням. При понижении новый тариф вступит в силу в следующем расчётном периоде.',
  },
  {
    q: 'Как работает автопродление?',
    a: 'Подписка автоматически продлевается каждый месяц. За 3 дня до списания мы отправим уведомление на email. Вы можете отключить автопродление в разделе "Подписка" — доступ сохранится до конца оплаченного периода.',
  },
  {
    q: 'Что происходит при неоплате?',
    a: 'При неуспешном списании мы повторим попытку через 3 и 7 дней. Если оплата не пройдёт, подписка будет приостановлена. Данные сохраняются в течение 30 дней, после чего могут быть удалены.',
  },
  {
    q: 'Поддерживается ли установка on-premise?',
    a: 'Да, тарифы Corporate и Unlimited поддерживают установку на собственных серверах заказчика. Для настройки on-premise свяжитесь с нашей службой поддержки через форму ниже.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function toggleFaq(idx: number) {
    setOpenFaq(openFaq === idx ? null : idx);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/portal/support', { subject, message });
      setSent(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при отправке. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-txt-primary mb-6">Поддержка</h1>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-txt-primary mb-4">Часто задаваемые вопросы</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-dark-card border border-dark-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left
                           hover:bg-dark-border/20 transition-colors"
              >
                <span className="text-sm font-medium text-txt-primary pr-4">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-txt-secondary flex-shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-txt-secondary leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-txt-primary mb-4">Создать обращение</h2>

        {sent && (
          <div className="mb-4 p-3 rounded-lg bg-status-green/10 border border-status-green/30 text-status-green text-sm">
            Обращение успешно создано! Мы ответим в течение 24 часов.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Тема</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Кратко опишите вопрос"
              required
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                         text-txt-primary placeholder-txt-secondary/50 focus:outline-none
                         focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Сообщение</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Опишите проблему или вопрос подробно..."
              required
              rows={5}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                         text-txt-primary placeholder-txt-secondary/50 focus:outline-none
                         focus:border-accent transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 bg-accent text-dark-bg font-medium rounded-lg
                       hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {sending ? 'Отправка...' : 'Создать обращение'}
          </button>
        </form>
      </div>
    </div>
  );
}
