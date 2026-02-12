/**
 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS
 * Dark-theme dashboard с KPI, Risk Matrix, Timeline и виджетами
 */

import React from "react";
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import ProcessMap from "../../components/qms/ProcessMap";

/* ------------------------------------------------------------------ */
/*  KPI data                                                          */
/* ------------------------------------------------------------------ */

const kpiCards: {
  label: string;
  value: string | number;
  color: string;
  bgClass: string;
  icon: React.ElementType;
}[] = [
  { label: "Документы",     value: 247,   color: "text-asvo-blue",   bgClass: "bg-asvo-blue-dim",   icon: FileText },
  { label: "NC открытых",   value: 8,     color: "text-asvo-red",    bgClass: "bg-asvo-red-dim",    icon: AlertTriangle },
  { label: "CAPA активных", value: 15,    color: "text-asvo-amber",  bgClass: "bg-asvo-amber-dim",  icon: RefreshCw },
  { label: "Аудиты",        value: "92%", color: "text-asvo-accent",  bgClass: "bg-asvo-green-dim",  icon: ClipboardList },
  { label: "Риски",         value: 34,    color: "text-asvo-purple",  bgClass: "bg-asvo-purple-dim", icon: Target },
];

/* ------------------------------------------------------------------ */
/*  Risk Matrix 5x5 data                                              */
/* ------------------------------------------------------------------ */

// riskMatrix[row][col]  — row = likelihood (5..1), col = severity (1..5)
// null means empty cell; number means count of risks at that position
const riskMatrix: (number | null)[][] = [
  /*  L5 */ [null, null,    1,    3,    2],
  /*  L4 */ [null,    1,    2,    1, null],
  /*  L3 */ [   1,    2, null,    1, null],
  /*  L2 */ [   1, null,    1, null, null],
  /*  L1 */ [null,    1, null, null, null],
];

const riskCellColor = (likelihood: number, severity: number): string => {
  const score = likelihood * severity;
  if (score <= 4)  return "bg-asvo-green-dim  text-asvo-green";
  if (score <= 9)  return "bg-asvo-amber-dim  text-asvo-amber";
  if (score <= 16) return "bg-[rgba(232,112,64,0.15)] text-asvo-orange";
  return                   "bg-asvo-red-dim    text-asvo-red";
};

/* ------------------------------------------------------------------ */
/*  Timeline data                                                     */
/* ------------------------------------------------------------------ */

const timelineEvents: {
  date: string;
  code: string;
  text: string;
  dotClass: string;
}[] = [
  { date: "11.02", code: "NC-091",   text: "Дефект покрытия DEXA-200",          dotClass: "bg-asvo-red" },
  { date: "10.02", code: "DOC-247",  text: "Обновлена СТО-045",                 dotClass: "bg-asvo-blue" },
  { date: "09.02", code: "CAPA-047", text: "Верификация чек-листа пайки",       dotClass: "bg-asvo-amber" },
  { date: "08.02", code: "AUD-012",  text: "Старт аудита закупок",              dotClass: "bg-asvo-blue" },
  { date: "07.02", code: "R-019",    text: "Новый риск поставки датчиков",      dotClass: "bg-asvo-purple" },
];

/* ------------------------------------------------------------------ */
/*  Widgets data                                                      */
/* ------------------------------------------------------------------ */

const overdueCapas: { code: string; text: string; days: number }[] = [
  { code: "CAPA-041", text: "Замена клея",     days: 14 },
  { code: "CAPA-038", text: "Калибровка",      days: 7 },
  { code: "CAPA-035", text: "Поставщик PCB",   days: 3 },
];

const calibrations: { code: string; name: string; days: number }[] = [
  { code: "EQ-001", name: "Мультиметр Fluke 87V",        days: 3 },
  { code: "EQ-005", name: "Осциллограф Rigol DS1104",     days: 7 },
  { code: "EQ-012", name: "Паяльная станция JBC",         days: 14 },
];

const trainingDepts: { dept: string; pct: number; barClass: string }[] = [
  { dept: "Производство", pct: 87, barClass: "bg-asvo-accent" },
  { dept: "ОТК",          pct: 72, barClass: "bg-asvo-blue" },
  { dept: "Закупки",      pct: 45, barClass: "bg-asvo-amber" },
  { dept: "Склад",        pct: 23, barClass: "bg-asvo-red" },
];

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export const QmsDashboardPage: React.FC = () => {
  /* ---------- helpers ---------- */

  // Rows are stored top-to-bottom (likelihood 5 → 1)
  const likelihoodLabels = [5, 4, 3, 2, 1];
  const severityLabels   = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">

      {/* ---------------------------------------------------------- */}
      {/*  KPI Cards                                                  */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgClass}`}>
                  <Icon size={16} className={kpi.color} />
                </div>
                <span className="text-xs text-asvo-text-dim">{kpi.label}</span>
              </div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Middle row: Risk Matrix + Timeline                         */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ---------- Risk Matrix 5x5 ---------- */}
        <div className="lg:col-span-2 bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-3">
            Матрица рисков 5 × 5
          </h3>

          {/* Column headers */}
          <div className="grid grid-cols-6 gap-1 mb-1">
            <div /> {/* empty top-left corner */}
            {severityLabels.map((s) => (
              <div key={s} className="text-[10px] text-asvo-text-dim text-center">
                S{s}
              </div>
            ))}
          </div>

          {/* Rows */}
          {riskMatrix.map((row, rowIdx) => {
            const likelihood = likelihoodLabels[rowIdx];
            return (
              <div key={likelihood} className="grid grid-cols-6 gap-1 mb-1">
                {/* Row label */}
                <div className="flex items-center justify-center text-[10px] text-asvo-text-dim">
                  L{likelihood}
                </div>

                {/* Cells */}
                {row.map((count, colIdx) => {
                  const severity = severityLabels[colIdx];
                  const hasValue = count !== null;

                  return (
                    <div
                      key={`${likelihood}-${severity}`}
                      className={`h-10 rounded flex items-center justify-center text-xs font-semibold ${
                        hasValue
                          ? riskCellColor(likelihood, severity)
                          : "bg-asvo-surface"
                      }`}
                    >
                      {hasValue ? count : ""}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            {[
              { label: "Низкий ≤4",   cls: "bg-asvo-green-dim" },
              { label: "Средний ≤9",   cls: "bg-asvo-amber-dim" },
              { label: "Высокий ≤16",  cls: "bg-[rgba(232,112,64,0.15)]" },
              { label: "Крит. >16",    cls: "bg-asvo-red-dim" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${l.cls}`} />
                <span className="text-[10px] text-asvo-text-dim">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Timeline ---------- */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-3">
            Последние события
          </h3>

          <div className="relative space-y-4 pl-5">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />

            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative flex items-start gap-3">
                {/* Dot */}
                <div
                  className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-asvo-surface-2 ${evt.dotClass}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-asvo-text-dim">{evt.date}</span>
                    <span className="text-xs font-semibold text-asvo-text">{evt.code}</span>
                  </div>
                  <p className="text-xs text-asvo-text-mid mt-0.5 truncate">
                    {evt.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Bottom widgets row                                         */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ---------- Widget 1: Просроченные CAPA ---------- */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-3">
            Просроченные CAPA
          </h3>

          <div className="space-y-3">
            {overdueCapas.map((c) => (
              <div key={c.code} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock size={14} className="text-asvo-red shrink-0" />
                  <span className="text-xs font-semibold text-asvo-red">{c.code}</span>
                  <span className="text-xs text-asvo-text-mid truncate">{c.text}</span>
                </div>
                <span className="text-xs font-bold text-asvo-red whitespace-nowrap ml-2">
                  {c.days}дн
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Widget 2: Ближайшие калибровки ---------- */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-3">
            Ближайшие калибровки
          </h3>

          <div className="space-y-3">
            {calibrations.map((eq) => (
              <div key={eq.code} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp size={14} className="text-asvo-text-dim shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-asvo-text">{eq.code}</span>
                    <span className="text-xs text-asvo-text-mid ml-1.5 truncate">{eq.name}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-asvo-amber whitespace-nowrap ml-2">
                  {eq.days} дня{eq.days === 7 ? "" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Widget 3: Обучение по отделам ---------- */}
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-3">
            Обучение по отделам
          </h3>

          <div className="space-y-3">
            {trainingDepts.map((d) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-asvo-text-mid">{d.dept}</span>
                  <span className="text-xs font-bold text-asvo-text">{d.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-asvo-bg">
                  <div
                    className={`h-1.5 rounded-full ${d.barClass}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Process Map                                                */}
      {/* ---------------------------------------------------------- */}
      <ProcessMap />
    </div>
  );
};
