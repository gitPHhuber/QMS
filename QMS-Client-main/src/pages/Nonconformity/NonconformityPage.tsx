/**
 * NonconformityPage.tsx — Реестр несоответствий (NC)
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.3 — Управление несоответствующей продукцией
 */

import React from "react";
import {
  AlertTriangle, Plus, Download, ClipboardList,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import StatusDot from "src/components/qms/StatusDot";
import ProgressBar from "src/components/qms/ProgressBar";

/* ─── Mock data ──────────────────────────────────────────────── */

interface NcRow {
  id: string;
  title: string;
  source: string;
  classification: "Критическое" | "Серьёзное" | "Незначительное";
  status: string;
  statusDot: "red" | "blue" | "purple" | "amber" | "accent";
  responsible: string;
  date: string;
  due: string;
}

const ncRows: NcRow[] = [
  { id: "NC-091", title: "Дефект покрытия корпуса DEXA-200", source: "Входной контроль", classification: "Критическое", status: "Открыто", statusDot: "red", responsible: "Омельченко А.", date: "11.02.2026", due: "13.02.2026" },
  { id: "NC-089", title: "Дефект пайки разъёма J4", source: "В процессе", classification: "Серьёзное", status: "Расследование", statusDot: "blue", responsible: "Омельченко А.", date: "09.02.2026", due: "14.02.2026" },
  { id: "NC-088", title: "Отклонение размеров корпуса", source: "Выходной контроль", classification: "Незначительное", status: "Диспозиция", statusDot: "purple", responsible: "Костюков И.", date: "06.02.2026", due: "16.02.2026" },
  { id: "NC-087", title: "Нарушение маркировки партии", source: "В процессе", classification: "Незначительное", status: "Верификация", statusDot: "amber", responsible: "Яровой Е.", date: "03.02.2026", due: "10.02.2026" },
  { id: "NC-086", title: "Некомплект поставки SUP-003", source: "Поставщик", classification: "Серьёзное", status: "Закрыто", statusDot: "accent", responsible: "Холтобин А.", date: "29.01.2026", due: "05.02.2026" },
  { id: "NC-085", title: "Поставка некомплект", source: "Поставщик", classification: "Незначительное", status: "Закрыто", statusDot: "accent", responsible: "Костюков И.", date: "25.01.2026", due: "28.01.2026" },
];

const workflowSteps = [
  { label: "Регистрация", active: true },
  { label: "Расследование", active: true },
  { label: "Диспозиция", active: false },
  { label: "Коррекция", active: false },
  { label: "Верификация", active: false },
  { label: "Закрытие", active: false },
];

const paretoItems: { label: string; pct: number; color: "red" | "amber" | "blue" | "purple" | "accent" }[] = [
  { label: "Дефект пайки", pct: 35, color: "red" },
  { label: "Входной контроль", pct: 25, color: "amber" },
  { label: "Размеры", pct: 18, color: "blue" },
  { label: "Маркировка", pct: 12, color: "purple" },
  { label: "Прочее", pct: 10, color: "accent" },
];

const classificationBadge: Record<string, { color: string; bg: string }> = {
  "Критическое":   { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  "Серьёзное":     { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  "Незначительное": { color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
};

/* ─── Component ──────────────────────────────────────────────── */

export const NonconformityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-red-dim rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-asvo-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Несоответствия</h1>
            <p className="text-sm text-asvo-text-dim">ISO 13485 §8.3 — Управление несоответствующей продукцией</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-asvo-accent text-asvo-bg rounded-lg text-sm font-semibold hover:brightness-110 transition">
            <Plus size={16} />
            Регистрировать NC
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-asvo-border text-asvo-text-mid rounded-lg text-sm font-medium hover:border-asvo-text-dim transition">
            <Download size={16} />
            Экспорт
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего NC", value: 47, cls: "text-asvo-blue" },
          { label: "Открытых", value: 8, cls: "text-asvo-red" },
          { label: "Просрочено", value: 3, cls: "text-asvo-red" },
          { label: "Закрыто (мес.)", value: 12, cls: "text-asvo-accent" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${kpi.cls}`}>{kpi.value}</div>
            <div className="text-xs text-asvo-text-dim mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-asvo-surface border-b border-asvo-border">
              {["ID", "Название", "Источник", "Классификация", "Статус", "Ответственный", "Дата", "Срок"].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ncRows.map((row) => {
              const cls = classificationBadge[row.classification];
              return (
                <tr
                  key={row.id}
                  className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono font-bold text-asvo-accent">{row.id}</td>
                  <td className="px-4 py-3 text-sm text-asvo-text">{row.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="audit">{row.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={cls.color} bg={cls.bg}>{row.classification}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-asvo-text">
                      <StatusDot color={row.statusDot} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-asvo-text-mid">{row.responsible}</td>
                  <td className="px-4 py-3 text-sm text-asvo-text-mid">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-asvo-text-mid">{row.due}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Bottom panels: Workflow + Pareto ─────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Workflow 6 steps (vertical, border-left) */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-asvo-accent" />
            <h3 className="text-sm font-semibold text-asvo-text">Workflow несоответствия</h3>
          </div>

          <div className="flex flex-col gap-1">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg border-l-[3px] ${
                  step.active
                    ? "border-l-asvo-accent bg-asvo-accent-dim"
                    : "border-l-asvo-border bg-transparent"
                }`}
              >
                <span
                  className={`text-xs font-bold w-5 text-center ${
                    step.active ? "text-asvo-accent" : "text-asvo-text-dim"
                  }`}
                >
                  {idx + 1}
                </span>
                <span
                  className={`text-sm font-medium ${
                    step.active ? "text-asvo-accent" : "text-asvo-text-dim"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pareto chart (5 rows with ProgressBar) */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-asvo-text mb-4">Pareto: источники NC (30 дн.)</h3>

          <div className="flex flex-col gap-3">
            {paretoItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-asvo-text">{item.label}</span>
                  <span className="text-sm font-semibold text-asvo-text-mid">{item.pct}%</span>
                </div>
                <ProgressBar value={item.pct} color={item.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
