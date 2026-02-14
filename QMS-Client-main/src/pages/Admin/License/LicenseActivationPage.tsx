import React, { useContext, useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from 'src/main';
import toast from 'react-hot-toast';
import {
  Shield, Upload, ClipboardPaste, CheckCircle, XCircle,
  AlertTriangle, Clock, Users, HardDrive,
} from 'lucide-react';
import clsx from 'clsx';

export const LicenseActivationPage: React.FC = observer(() => {
  const context = useContext(Context);
  if (!context) throw new Error('Context required');
  const { license, modules } = context;

  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [pasteValue, setPasteValue] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    license.fetchLicense();
  }, []);

  const handleActivate = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      toast.error('Лицензионный ключ не может быть пустым.');
      return;
    }
    const result = await license.activate(trimmed);
    if (result.success) {
      toast.success('Лицензия успешно активирована!');
      modules.fetchModules(); // Refresh module config
    } else {
      toast.error(result.error || 'Ошибка активации');
    }
  }, [license, modules]);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) handleActivate(content);
    };
    reader.readAsText(file);
  }, [handleActivate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const lic = license.license;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-asvo-light mb-1">Лицензия</h1>
      <p className="text-sm text-asvo-muted mb-6">
        Активация и управление лицензионным ключом ASVO-QMS
      </p>

      {/* Current License Status */}
      {lic && (
        <div className={clsx(
          "rounded-xl border p-5 mb-6",
          lic.active
            ? lic.isReadOnly
              ? "bg-red-950/20 border-red-800/40"
              : lic.isGrace
                ? "bg-amber-950/20 border-amber-800/40"
                : "bg-emerald-950/20 border-emerald-800/40"
            : "bg-asvo-dark-2 border-asvo-dark-3/50"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className={
              lic.active
                ? lic.isReadOnly ? 'text-red-400' : lic.isGrace ? 'text-amber-400' : 'text-emerald-400'
                : 'text-asvo-muted'
            } />
            <h2 className="text-sm font-bold text-asvo-light">
              {lic.active ? 'Лицензия активна' : 'Лицензия не активирована'}
            </h2>
            {lic.active && lic.isReadOnly && (
              <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
                <XCircle size={13} /> Только чтение
              </span>
            )}
            {lic.active && lic.isGrace && (
              <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle size={13} /> Грейс-период
              </span>
            )}
            {lic.active && !lic.isGrace && !lic.isReadOnly && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle size={13} /> Активна
              </span>
            )}
          </div>

          {lic.active && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard
                icon={Shield}
                label="Тариф"
                value={lic.tierName || '—'}
                color="text-teal-400"
              />
              <InfoCard
                icon={Clock}
                label="Дней осталось"
                value={lic.daysRemaining != null ? String(lic.daysRemaining) : '—'}
                color={
                  lic.isReadOnly ? 'text-red-400'
                    : (lic.daysRemaining != null && lic.daysRemaining <= 14) ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              />
              <InfoCard
                icon={Users}
                label="Макс. пользователей"
                value={String(lic.limits.max_users)}
                color="text-blue-400"
              />
              <InfoCard
                icon={HardDrive}
                label="Хранилище"
                value={`${lic.limits.max_storage_gb} ГБ`}
                color="text-purple-400"
              />
            </div>
          )}

          {lic.active && lic.validUntil && (
            <p className="text-xs text-asvo-muted mt-3">
              Действительна до: {new Date(lic.validUntil).toLocaleDateString('ru-RU')}
              {' \u2022 '}
              Модулей: {lic.modules.length}
            </p>
          )}
        </div>
      )}

      {/* Activation Form */}
      <div className="bg-asvo-dark-2 rounded-xl border border-asvo-dark-3/50 p-5">
        <h2 className="text-sm font-bold text-asvo-light mb-4">
          {lic?.active ? 'Обновить лицензию' : 'Активировать лицензию'}
        </h2>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('file')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
              mode === 'file'
                ? "bg-asvo-accent/10 text-asvo-accent border border-asvo-accent/30"
                : "text-asvo-muted hover:text-asvo-light border border-asvo-dark-3/50"
            )}
          >
            <Upload size={13} /> Загрузить файл
          </button>
          <button
            onClick={() => setMode('paste')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
              mode === 'paste'
                ? "bg-asvo-accent/10 text-asvo-accent border border-asvo-accent/30"
                : "text-asvo-muted hover:text-asvo-light border border-asvo-dark-3/50"
            )}
          >
            <ClipboardPaste size={13} /> Вставить ключ
          </button>
        </div>

        {mode === 'file' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={clsx(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              dragOver
                ? "border-asvo-accent bg-asvo-accent/5"
                : "border-asvo-dark-3 hover:border-asvo-dark-3/80"
            )}
          >
            <Upload size={32} className="mx-auto text-asvo-muted mb-3" />
            <p className="text-sm text-asvo-muted mb-2">
              Перетащите файл <code className="text-asvo-accent">.lic</code> сюда
            </p>
            <p className="text-xs text-asvo-muted/60 mb-3">или</p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-asvo-dark-3 text-asvo-light text-sm cursor-pointer hover:bg-asvo-dark-3/80 transition">
              <Upload size={14} />
              Выбрать файл
              <input
                type="file"
                accept=".lic,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder="Вставьте лицензионный ключ..."
              rows={4}
              className="w-full bg-asvo-dark rounded-lg border border-asvo-dark-3 text-asvo-light text-sm p-3 placeholder:text-asvo-muted/40 focus:outline-none focus:border-asvo-accent/50 resize-none font-mono"
            />
            <button
              onClick={() => handleActivate(pasteValue)}
              disabled={!pasteValue.trim() || license.activating}
              className={clsx(
                "mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                pasteValue.trim() && !license.activating
                  ? "bg-asvo-accent text-asvo-dark hover:bg-asvo-accent/90"
                  : "bg-asvo-dark-3 text-asvo-muted cursor-not-allowed"
              )}
            >
              <Shield size={14} />
              {license.activating ? 'Активация...' : 'Активировать'}
            </button>
          </div>
        )}

        {license.activateError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-950/20 rounded-lg px-3 py-2 border border-red-800/30">
            <XCircle size={13} />
            {license.activateError}
          </div>
        )}
      </div>
    </div>
  );
});

function InfoCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-asvo-dark/40 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={color} />
        <span className="text-[10px] text-asvo-muted">{label}</span>
      </div>
      <span className={clsx("text-sm font-bold", color)}>{value}</span>
    </div>
  );
}
