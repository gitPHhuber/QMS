import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from 'src/main';
import { Shield, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const LicenseActivationPage = observer(() => {
  const context = useContext(Context);
  if (!context) return null;
  const { license, modules } = context;

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const result = await license.activateLicense(file);
    if (result.success) {
      setMessage({ type: 'success', text: 'Лицензия успешно активирована!' });
      modules.fetchModules();
    } else {
      setMessage({ type: 'error', text: result.error || 'Ошибка активации' });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const info = license.info;
  const badgeColor = license.badgeColor;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-asvo-accent" />
        <h1 className="text-xl font-bold text-asvo-light">Управление лицензией</h1>
      </div>

      {/* Current Status */}
      <div className="bg-asvo-dark-1 border border-asvo-dark-3 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-asvo-muted mb-4 uppercase tracking-wider">Текущий статус</h2>
        {info && info.payload ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {badgeColor === 'green' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {badgeColor === 'yellow' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
              {badgeColor === 'red' && <XCircle className="w-5 h-5 text-red-400" />}
              <span className="text-asvo-light font-medium">
                {info.valid ? 'Лицензия активна' : 'Лицензия недействительна'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-asvo-muted">Тариф:</span>{' '}
                <span className="text-asvo-light font-medium">{license.tierName}</span>
              </div>
              <div>
                <span className="text-asvo-muted">До истечения:</span>{' '}
                <span className="text-asvo-light font-medium">
                  {info.expired ? (info.inGrace ? 'Грейс-период' : 'Истекла') : `${info.daysUntilExpiry} дн.`}
                </span>
              </div>
              <div>
                <span className="text-asvo-muted">Макс. пользователей:</span>{' '}
                <span className="text-asvo-light font-medium">{info.limits.max_users}</span>
              </div>
              <div>
                <span className="text-asvo-muted">Макс. хранилище:</span>{' '}
                <span className="text-asvo-light font-medium">{info.limits.max_storage_gb} ГБ</span>
              </div>
            </div>
            {info.modules && info.modules.length > 0 && !info.modules.includes('*') && (
              <div>
                <span className="text-asvo-muted text-sm">Модули:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {info.modules.map((m: string) => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-asvo-dark-2 border border-asvo-dark-3 text-asvo-light">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-asvo-muted">
            <XCircle className="w-5 h-5 text-red-400" />
            <span>Лицензия не установлена. Система работает в режиме по умолчанию.</span>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-asvo-dark-1 border border-asvo-dark-3 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-asvo-muted mb-4 uppercase tracking-wider">Активация лицензии</h2>
        <p className="text-sm text-asvo-muted mb-4">
          Загрузите файл лицензии (.lic), полученный от ASVO License Service.
        </p>
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-asvo-dark-3 hover:border-asvo-accent/50 cursor-pointer transition text-asvo-muted hover:text-asvo-accent">
          <Upload className="w-5 h-5" />
          <span>{uploading ? 'Загрузка...' : 'Выбрать файл .lic'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".lic"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {message && (
          <div className={`mt-4 text-sm flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
});
