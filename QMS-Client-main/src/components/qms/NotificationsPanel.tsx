/**
 * NotificationsPanel.tsx — Выдвижная панель уведомлений
 * Fixed right panel, 380px wide
 */

import React from "react";
import {
  X, AlertTriangle, Wrench, RefreshCw,
  ClipboardList, Package, FileText, GraduationCap,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */

type NotificationType = "nc" | "equip" | "capa" | "audit" | "stock" | "doc" | "training";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

/* ─── Mock data ──────────────────────────────────────── */

const notifications: Notification[] = [
  { id: 1, type: "nc", title: "Новое NC-091 зарегистрировано", description: "Дефект покрытия корпуса DEXA-200. Критическое.", time: "5 мин", read: false },
  { id: 2, type: "equip", title: "Калибровка EQ-041 истекает", description: "Паяльная станция SMD — осталось 3 дня до калибровки.", time: "32 мин", read: false },
  { id: 3, type: "capa", title: "CAPA-048 обновлена", description: "Этап D4 завершён. Костюков И.А. перешёл к D5.", time: "1 ч", read: false },
  { id: 4, type: "audit", title: "Аудит AUD-012 запланирован", description: "Внутренний аудит участка SMD-монтажа на 15.02.2026.", time: "2 ч", read: true },
  { id: 5, type: "stock", title: "Критический уровень склада", description: "Припой Sn63Pb37 — остаток ниже min (2 кг из 5 кг).", time: "3 ч", read: true },
  { id: 6, type: "doc", title: "SOP-012 требует пересмотра", description: "Срок пересмотра SOP-012 истекает 18.02.2026.", time: "5 ч", read: true },
  { id: 7, type: "training", title: "Обучение: SMD-монтаж", description: "Назначено обучение для 3 операторов. Срок: 20.02.2026.", time: "1 дн", read: true },
];

/* ─── Icon map ───────────────────────────────────────── */

const ICON_MAP: Record<NotificationType, { icon: React.ElementType; className: string }> = {
  nc:       { icon: AlertTriangle, className: "bg-asvo-red-dim text-asvo-red" },
  equip:    { icon: Wrench, className: "bg-asvo-amber-dim text-asvo-amber" },
  capa:     { icon: RefreshCw, className: "bg-asvo-purple-dim text-asvo-purple" },
  audit:    { icon: ClipboardList, className: "bg-asvo-blue-dim text-asvo-blue" },
  stock:    { icon: Package, className: "bg-asvo-amber-dim text-asvo-amber" },
  doc:      { icon: FileText, className: "bg-asvo-green-dim text-asvo-green" },
  training: { icon: GraduationCap, className: "bg-asvo-blue-dim text-asvo-blue" },
};

/* ─── Component ──────────────────────────────────────── */

interface NotificationsPanelProps {
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  return (
    <div
      className="fixed top-[56px] right-0 z-50 bg-asvo-card border-l border-asvo-border shadow-[-8px_0_32px_rgba(0,0,0,0.3)]"
      style={{ width: 380, height: "calc(100vh - 56px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5 border-b border-asvo-border">
        <h3 className="text-base font-bold text-asvo-text">Уведомления</h3>
        <div className="flex items-center gap-3">
          <button className="text-xs text-asvo-accent hover:underline font-medium">
            Отметить все
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-asvo-surface-2 text-asvo-text-dim rounded-lg hover:bg-asvo-text hover:text-asvo-bg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scroll list */}
      <div className="overflow-auto" style={{ height: "calc(100% - 57px)" }}>
        {notifications.map((n) => {
          const iconCfg = ICON_MAP[n.type];
          const Icon = iconCfg.icon;

          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-3.5 border-b border-asvo-border/20 cursor-pointer hover:bg-asvo-surface-2 transition-colors ${
                !n.read
                  ? "bg-asvo-surface-2 border-l-[3px] border-l-asvo-accent"
                  : "bg-transparent border-l-[3px] border-l-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCfg.className}`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] text-asvo-text ${!n.read ? "font-semibold" : ""}`}>
                  {n.title}
                </div>
                <div className="text-[11px] text-asvo-text-dim mt-0.5 leading-relaxed">
                  {n.description}
                </div>
              </div>
              <span className="text-[10px] text-asvo-text-dim shrink-0 mt-0.5">{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPanel;
