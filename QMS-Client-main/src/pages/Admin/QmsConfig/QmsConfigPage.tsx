/**
 * QmsConfigPage.tsx — Настройки QMS (светлая тема)
 * Admin section: Общие настройки, нумерация, уведомления, hash-chain
 */

import React, { useState } from "react";
import { Settings2, Link2, Search } from "lucide-react";

/* ─── Toggle Switch ──────────────────────────────────── */

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`w-9 h-5 rounded-full relative transition-colors ${
        enabled ? "bg-emerald-500" : "bg-gray-200"
      }`}
    >
      <div
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
        style={{ transform: enabled ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  </div>
);

/* ─── Numbering row ──────────────────────────────────── */

interface NumberingRowProps {
  entity: string;
  prefix: string;
  next: string;
  colorClass: string;
}

const NumberingRow: React.FC<NumberingRowProps> = ({ entity, prefix, next, colorClass }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-500">{entity}</span>
    <span className={`font-mono font-semibold text-sm ${colorClass}`}>
      {prefix}{next}
    </span>
  </div>
);

/* ─── Stat Box ───────────────────────────────────────── */

interface StatBoxProps {
  value: string | number;
  label: string;
  colorClass: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label, colorClass }) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center">
    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
    <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
  </div>
);

/* ─── Component ──────────────────────────────────────── */

export const QmsConfigPage: React.FC = () => {
  const [channels, setChannels] = useState({
    email: true,
    telegram: true,
    push: false,
  });

  const [triggers, setTriggers] = useState({
    capaOverdue: true,
    calibration: true,
    docReview: false,
    newNc: true,
    auditStatus: true,
    criticalStock: true,
  });

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
          <Settings2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Настройки QMS</h1>
          <p className="text-sm text-gray-500">Конфигурация системы менеджмента качества</p>
        </div>
      </div>

      {/* Grid 2 col */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Card 1: Общие настройки */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">Общие настройки QMS</h3>
          <div className="space-y-3">
            {[
              { label: "Организация", value: 'ООО «АСВОТЕХ»' },
              { label: "Стандарт", value: "ISO 13485:2016" },
              { label: "Рег. рынок", value: "Россия (ГОСТ)" },
              { label: "Язык", value: "Русский" },
              { label: "Часовой пояс", value: "UTC+7 (Новосибирск)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
            Редактировать
          </button>
        </div>

        {/* Card 2: Нумерация */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">Нумерация сущностей</h3>
          <div className="space-y-1">
            <NumberingRow entity="Несоответствие (NC)" prefix="NC-" next="090" colorClass="text-red-500" />
            <NumberingRow entity="CAPA" prefix="CAPA-" next="049" colorClass="text-amber-500" />
            <NumberingRow entity="Риск" prefix="R-" next="019" colorClass="text-orange-500" />
            <NumberingRow entity="Аудит" prefix="AUD-" next="014" colorClass="text-blue-500" />
            <NumberingRow entity="Документ" prefix="DOC-" next="248" colorClass="text-teal-500" />
            <NumberingRow entity="Оборудование" prefix="EQ-" next="043" colorClass="text-purple-500" />
          </div>
        </div>
      </div>

      {/* Card 3: Уведомления */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-4">Настройки уведомлений</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Каналы</h4>
            <ToggleSwitch label="Email уведомления" enabled={channels.email} onChange={(v) => setChannels(p => ({ ...p, email: v }))} />
            <ToggleSwitch label="Telegram бот" enabled={channels.telegram} onChange={(v) => setChannels(p => ({ ...p, telegram: v }))} />
            <ToggleSwitch label="Push в браузере" enabled={channels.push} onChange={(v) => setChannels(p => ({ ...p, push: v }))} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Триггеры</h4>
            <ToggleSwitch label="Просрочка CAPA (за 3 дня)" enabled={triggers.capaOverdue} onChange={(v) => setTriggers(p => ({ ...p, capaOverdue: v }))} />
            <ToggleSwitch label="Калибровка (за 7 дней)" enabled={triggers.calibration} onChange={(v) => setTriggers(p => ({ ...p, calibration: v }))} />
            <ToggleSwitch label="Пересмотр документов" enabled={triggers.docReview} onChange={(v) => setTriggers(p => ({ ...p, docReview: v }))} />
            <ToggleSwitch label="Новые NC" enabled={triggers.newNc} onChange={(v) => setTriggers(p => ({ ...p, newNc: v }))} />
            <ToggleSwitch label="Изменение статуса аудита" enabled={triggers.auditStatus} onChange={(v) => setTriggers(p => ({ ...p, auditStatus: v }))} />
            <ToggleSwitch label="Критический уровень склада" enabled={triggers.criticalStock} onChange={(v) => setTriggers(p => ({ ...p, criticalStock: v }))} />
          </div>
        </div>
      </div>

      {/* Card 4: Hash-chain */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Link2 size={24} className="text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-800">Hash-chain верификация аудит-трейла</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                  Целостность подтверждена
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                SHA-256 &bull; Block #2847 &bull; 0 нарушений &bull; Посл. проверка: 11.02.2026 12:00
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <Search size={14} />
            Верифицировать
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatBox value="2,847" label="Всего записей" colorClass="text-blue-600" />
          <StatBox value="34" label="Сегодня" colorClass="text-emerald-600" />
          <StatBox value="5" label="Юзеров" colorClass="text-purple-600" />
          <StatBox value="12" label="Сущностей" colorClass="text-amber-600" />
        </div>
      </div>
    </div>
  );
};

export default QmsConfigPage;
