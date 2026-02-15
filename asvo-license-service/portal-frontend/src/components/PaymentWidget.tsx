import { useState } from 'react';

export default function PaymentWidget() {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="text-lg font-semibold text-txt-primary mb-4">Способ оплаты</h3>

      {!showWidget ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-txt-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
          </div>
          <p className="text-txt-secondary text-sm mb-4">
            Привяжите банковскую карту для автоматической оплаты подписки
          </p>
          <button
            onClick={() => setShowWidget(true)}
            className="px-6 py-2.5 bg-accent text-dark-bg font-medium rounded-lg
                       hover:bg-accent/90 transition-colors"
          >
            Привязать карту
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mock YuKassa widget area */}
          <div className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center">
            <div className="text-txt-secondary text-sm mb-2">
              Здесь будет виджет ЮKassa
            </div>
            <div className="inline-flex items-center gap-2 bg-dark-bg rounded-lg px-4 py-2">
              <span className="text-txt-secondary text-xs">YooMoney Payment Widget</span>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                           text-txt-primary placeholder-txt-secondary/50 text-sm"
                disabled
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary placeholder-txt-secondary/50 text-sm"
                  disabled
                />
                <input
                  type="text"
                  placeholder="CVV"
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5
                             text-txt-primary placeholder-txt-secondary/50 text-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowWidget(false)}
              className="px-4 py-2 border border-dark-border rounded-lg text-sm
                         text-txt-secondary hover:text-txt-primary transition-colors"
            >
              Отмена
            </button>
            <button
              className="px-6 py-2 bg-accent text-dark-bg font-medium rounded-lg text-sm
                         hover:bg-accent/90 transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              Привязать (интеграция в разработке)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
