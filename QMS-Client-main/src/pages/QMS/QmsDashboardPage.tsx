/**
 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS
 * Dark-theme dashboard с KPI, Risk Matrix, Timeline и виджетами
 */

import React, { useState } from "react";
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Truck,
  MessageSquareWarning,
  FileCheck,
  ClipboardCheck,
  Factory,
  CheckCircle2,
  Circle,
  Activity,
} from "lucide-react";

import ProcessMap from "../../components/qms/ProcessMap";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TabBar from "../../components/qms/TabBar";


/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DashboardRole = "quality_manager" | "production_head" | "director";

interface KpiCard {
  label: string;
  value: string | number;
  color: string;
  bgClass: string;
  icon: React.ElementType;
  roles: DashboardRole[];
}

interface SupplierStatusItem {
  status: string;
  count: number;
  colorClass: string;
}

interface CapaEfficiencyData {
  closedOnTime: number;
  closedLate: number;
  total: number;
  avgCloseDays: number;
  effectivenessRate: number;
}

interface ComplaintsData {
  open: number;
  investigating: number;
  closedThisMonth: number;
  avgResponseDays: number;
}

interface TrendPoint {
  month: string;
  nc: number;
  capa: number;
}

interface DocApprovalItem {
  code: string;
  title: string;
  days: number;
  status: "overdue" | "pending";
}

interface DocsApprovalData {
  awaitingReview: number;
  overdue: number;
  avgApprovalDays: number;
  docs: DocApprovalItem[];
}

interface NextAuditData {
  code: string;
  title: string;
  scope: string;
  plannedDate: string;
  daysUntil: number;
  leadAuditor: string;
  type: "internal" | "external";
}

interface ManagementReviewItem {
  item: string;
  ready: boolean;
}

interface ManagementReviewData {
  nextReviewDate: string;
  daysUntil: number;
  readiness: ManagementReviewItem[];
  completionPct: number;
}

interface MesMetricsData {
  defectRate: number;
  defectRateTrend: number;
  yieldRate: number;
  productionToday: number;
  productionTarget: number;
  lineStatus: "running" | "stopped" | "maintenance";
}

interface TimelineEvent {
  date: string;
  code: string;
  text: string;
  dotClass: string;
  category: "nc" | "doc" | "capa" | "audit" | "risk" | "equipment";
}

/* ------------------------------------------------------------------ */
/*  Role tabs                                                          */
/* ------------------------------------------------------------------ */

const roleTabs: { key: string; label: string }[] = [
  { key: "quality_manager", label: "Менеджер качества" },
  { key: "production_head", label: "Нач. производства" },
  { key: "director",        label: "Руководство" },
];

/* ------------------------------------------------------------------ */
/*  KPI data                                                          */
/* ------------------------------------------------------------------ */

const kpiCards: KpiCard[] = [
  { label: "Документы",     value: 247,   color: "text-asvo-blue",   bgClass: "bg-asvo-blue-dim",   icon: FileText,            roles: ["quality_manager", "director"] },
  { label: "NC открытых",   value: 8,     color: "text-asvo-red",    bgClass: "bg-asvo-red-dim",    icon: AlertTriangle,       roles: ["quality_manager", "production_head", "director"] },
  { label: "CAPA активных", value: 15,    color: "text-asvo-amber",  bgClass: "bg-asvo-amber-dim",  icon: RefreshCw,           roles: ["quality_manager", "production_head", "director"] },
  { label: "Аудиты",        value: "92%", color: "text-asvo-accent", bgClass: "bg-asvo-green-dim",  icon: ClipboardList,       roles: ["quality_manager", "director"] },
  { label: "Риски",         value: 34,    color: "text-asvo-purple", bgClass: "bg-asvo-purple-dim", icon: Target,              roles: ["quality_manager", "director"] },
  { label: "Жалобы откр.",  value: 3,     color: "text-asvo-amber",  bgClass: "bg-asvo-amber-dim",  icon: MessageSquareWarning, roles: ["quality_manager", "director"] },
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

const timelineEvents: TimelineEvent[] = [
  { date: "11.02", code: "NC-091",   text: "Дефект покрытия DEXA-200",          dotClass: "bg-asvo-red",    category: "nc" },
  { date: "10.02", code: "DOC-247",  text: "Обновлена СТО-045",                 dotClass: "bg-asvo-blue",   category: "doc" },
  { date: "09.02", code: "CAPA-047", text: "Верификация чек-листа пайки",       dotClass: "bg-asvo-amber",  category: "capa" },
  { date: "08.02", code: "AUD-012",  text: "Старт аудита закупок",              dotClass: "bg-asvo-blue",   category: "audit" },
  { date: "07.02", code: "R-019",    text: "Новый риск поставки датчиков",      dotClass: "bg-asvo-purple", category: "risk" },
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

/* ------------------------------------------------------------------ */
/*  New mock data                                                     */
/* ------------------------------------------------------------------ */

const supplierStatus: SupplierStatusItem[] = [
  { status: "Одобрен",       count: 12, colorClass: "bg-asvo-accent" },
  { status: "Условный",      count: 3,  colorClass: "bg-asvo-amber" },
  { status: "На переоценке", count: 2,  colorClass: "bg-asvo-blue" },
  { status: "Заблокирован",  count: 1,  colorClass: "bg-asvo-red" },
];

const capaEfficiency: CapaEfficiencyData = {
  closedOnTime: 42,
  closedLate: 8,
  total: 50,
  avgCloseDays: 18,
  effectivenessRate: 84,
};

const complaints: ComplaintsData = {
  open: 3,
  investigating: 1,
  closedThisMonth: 5,
  avgResponseDays: 4.2,
};

const trendData: TrendPoint[] = [
  { month: "Мар", nc: 5,  capa: 3 },
  { month: "Апр", nc: 7,  capa: 4 },
  { month: "Май", nc: 4,  capa: 2 },
  { month: "Июн", nc: 8,  capa: 5 },
  { month: "Июл", nc: 6,  capa: 3 },
  { month: "Авг", nc: 9,  capa: 6 },
  { month: "Сен", nc: 5,  capa: 4 },
  { month: "Окт", nc: 7,  capa: 5 },
  { month: "Ноя", nc: 4,  capa: 3 },
  { month: "Дек", nc: 6,  capa: 4 },
  { month: "Янв", nc: 8,  capa: 5 },
  { month: "Фев", nc: 3,  capa: 2 },
];

const docsApproval: DocsApprovalData = {
  awaitingReview: 5,
  overdue: 2,
  avgApprovalDays: 3.4,
  docs: [
    { code: "SOP-012", title: "Процедура входного контроля", days: 5, status: "overdue" },
    { code: "WI-034",  title: "Инструкция пайки BGA",       days: 2, status: "pending" },
    { code: "FRM-019", title: "Форма протокола испытаний",   days: 1, status: "pending" },
  ],
};

const nextAudit: NextAuditData = {
  code: "IA-2026-004",
  title: "Аудит процесса закупок",
  scope: "ISO 13485 п.7.4 — Закупки",
  plannedDate: "28.02.2026",
  daysUntil: 16,
  leadAuditor: "Костюков И.",
  type: "internal",
};

const managementReviewChecklist: ManagementReviewData = {
  nextReviewDate: "15.03.2026",
  daysUntil: 31,
  readiness: [
    { item: "Результаты аудитов",          ready: true },
    { item: "Обратная связь потребителей",  ready: true },
    { item: "Показатели процессов",         ready: false },
    { item: "Статус CAPA",                  ready: true },
    { item: "Предупреждающие действия",     ready: false },
    { item: "Изменения в СМК",             ready: true },
    { item: "Рекомендации по улучшению",    ready: false },
    { item: "Регуляторные изменения",       ready: true },
  ],
  completionPct: 62.5,
};

const mesMetrics: MesMetricsData = {
  defectRate: 2.3,
  defectRateTrend: -0.5,
  yieldRate: 97.7,
  productionToday: 48,
  productionTarget: 60,
  lineStatus: "running",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const supplierTotal = supplierStatus.reduce((s, i) => s + i.count, 0);
const supplierApprovedPct = Math.round(
  (supplierStatus[0].count / supplierTotal) * 100,
);

const effColor = (rate: number): string => {
  if (rate >= 80) return "text-[#2DD4A8]";
  if (rate >= 60) return "text-[#E8A830]";
  return "text-[#F06060]";
};

const auditDaysBadge = (days: number): string => {
  if (days > 14) return "bg-asvo-green-dim text-[#2DD4A8]";
  if (days >= 7) return "bg-asvo-amber-dim text-[#E8A830]";
  return "bg-asvo-red-dim text-[#F06060]";
};

const lineStatusLabel: Record<MesMetricsData["lineStatus"], { text: string; cls: string }> = {
  running:     { text: "Работает",     cls: "bg-asvo-green-dim text-[#2DD4A8]" },
  stopped:     { text: "Остановлена",  cls: "bg-asvo-red-dim text-[#F06060]" },
  maintenance: { text: "Обслуживание", cls: "bg-asvo-amber-dim text-[#E8A830]" },
};

/* ------------------------------------------------------------------ */
/*  Custom Recharts Tooltip                                            */
/* ------------------------------------------------------------------ */

const TrendTooltipContent: React.FC<{
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{ background: "#1A2332", borderColor: "#2D3748" }}
    >
      <p className="text-asvo-text-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "nc" ? "NC" : "CAPA"}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export const QmsDashboardPage: React.FC = () => {
  const [role, setRole] = useState<DashboardRole>("quality_manager");

  /* ---------- visibility helper ---------- */
  const show = (qm: boolean, ph: boolean, dir: boolean): boolean => {
    switch (role) {
      case "quality_manager": return qm;
      case "production_head": return ph;
      case "director":        return dir;
    }
  };

  /* ---------- filtered data ---------- */
  const filteredKpi = kpiCards.filter((k) => k.roles.includes(role));

  const filteredEvents =
    role === "production_head"
      ? timelineEvents.filter((e) => e.category === "nc" || e.category === "equipment")
      : timelineEvents;

  const kpiGridCols =
    filteredKpi.length <= 2
      ? "lg:grid-cols-2"
      : filteredKpi.length <= 3
        ? "lg:grid-cols-3"
        : filteredKpi.length <= 5
          ? "lg:grid-cols-5"
          : "lg:grid-cols-6";

  /* ---------- helpers ---------- */

  // Rows are stored top-to-bottom (likelihood 5 → 1)
  const likelihoodLabels = [5, 4, 3, 2, 1];
  const severityLabels   = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">

      {/* ---------------------------------------------------------- */}
      {/*  Role Switcher                                              */}
      {/* ---------------------------------------------------------- */}
      <TabBar
        tabs={roleTabs}
        active={role}
        onChange={(key) => setRole(key as DashboardRole)}
      />

      {/* ---------------------------------------------------------- */}
      {/*  KPI Cards                                                  */}
      {/* ---------------------------------------------------------- */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${kpiGridCols} gap-3`}>
        {filteredKpi.map((kpi) => {
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
      {show(true, false, true) && (
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
      )}

      {/* Risk matrix hidden but timeline visible for production_head */}
      {role === "production_head" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ---------- Timeline (filtered) ---------- */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Последние события
            </h3>

            <div className="relative space-y-4 pl-5">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />

              {filteredEvents.map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-asvo-surface-2 ${evt.dotClass}`}
                  />
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
      )}

      {/* ---------------------------------------------------------- */}
      {/*  NC / CAPA Trends (12 months)                               */}
      {/* ---------------------------------------------------------- */}
      {show(true, true, true) && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-4">
            Тренды NC / CAPA (12 мес.)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<TrendTooltipContent />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
                formatter={(value: string) => (value === "nc" ? "NC" : "CAPA")}
              />
              <Line
                type="monotone"
                dataKey="nc"
                stroke="#F06060"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F06060" }}
                activeDot={{ r: 5 }}
                name="nc"
              />
              <Line
                type="monotone"
                dataKey="capa"
                stroke="#E8A830"
                strokeWidth={2}
                dot={{ r: 3, fill: "#E8A830" }}
                activeDot={{ r: 5 }}
                name="capa"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Bottom widgets grid                                        */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ---------- Widget: Просроченные CAPA ---------- */}
        {show(true, false, true) && (
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
        )}

        {/* ---------- Widget: Эффективность CAPA ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Эффективность CAPA
            </h3>

            <div className={`text-3xl font-bold mb-3 ${effColor(capaEfficiency.effectivenessRate)}`}>
              {capaEfficiency.effectivenessRate}%
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Закрыто в срок</span>
                <span className="font-semibold text-asvo-text">{capaEfficiency.closedOnTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Закрыто с просрочкой</span>
                <span className="font-semibold text-[#F06060]">{capaEfficiency.closedLate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Среднее время закрытия</span>
                <span className="font-semibold text-asvo-text">{capaEfficiency.avgCloseDays} дн.</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Widget: Ближайшие калибровки ---------- */}
        {show(true, true, false) && (
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
        )}

        {/* ---------- Widget: Поставщики ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <Truck size={14} className="text-asvo-text-dim" />
              Поставщики
            </h3>

            <div className="space-y-2 mb-3">
              {supplierStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.colorClass}`} />
                    <span className="text-asvo-text-mid">{s.status}</span>
                  </div>
                  <span className="font-semibold text-asvo-text">{s.count}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-asvo-text-dim mb-1">
              Одобрено: {supplierApprovedPct}%
            </div>
            <div className="h-1.5 rounded-full bg-asvo-bg">
              <div
                className="h-1.5 rounded-full bg-asvo-accent"
                style={{ width: `${supplierApprovedPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ---------- Widget: Обучение по отделам ---------- */}
        {show(true, true, true) && (
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
        )}

        {/* ---------- Widget: Документы на согласовании ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <FileCheck size={14} className="text-asvo-text-dim" />
              Документы на согласовании
            </h3>

            <div className="flex gap-3 mb-3 text-xs">
              <div>
                <span className="text-asvo-text-dim">Ожидают: </span>
                <span className="font-semibold text-asvo-text">{docsApproval.awaitingReview}</span>
              </div>
              <div>
                <span className="text-asvo-text-dim">Просрочено: </span>
                <span className="font-semibold text-[#F06060]">{docsApproval.overdue}</span>
              </div>
            </div>

            <div className="space-y-2">
              {docsApproval.docs.map((doc) => (
                <div key={doc.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-asvo-text">{doc.code}</span>
                    <span className="text-xs text-asvo-text-mid truncate">{doc.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2 whitespace-nowrap ${
                      doc.status === "overdue"
                        ? "bg-asvo-red-dim text-[#F06060]"
                        : "bg-asvo-amber-dim text-[#E8A830]"
                    }`}
                  >
                    {doc.status === "overdue" ? "Просрочен" : "Ожидает"} · {doc.days}дн
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- Widget: Жалобы / Обратная связь ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <MessageSquareWarning size={14} className="text-[#E8A830]" />
              Жалобы / Обратная связь
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Открытые</span>
                <span className="font-semibold text-[#E8A830]">{complaints.open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">На расследовании</span>
                <span className="font-semibold text-asvo-text">{complaints.investigating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Закрыто за месяц</span>
                <span className="font-semibold text-[#2DD4A8]">{complaints.closedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Среднее время ответа</span>
                <span className="font-semibold text-asvo-text">{complaints.avgResponseDays} дн.</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Widget: Ближайший аудит ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <ClipboardCheck size={14} className="text-asvo-text-dim" />
              Ближайший аудит
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-asvo-text">{nextAudit.code}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${auditDaysBadge(nextAudit.daysUntil)}`}
                >
                  {nextAudit.daysUntil} дн.
                </span>
              </div>
              <p className="text-asvo-text-mid">{nextAudit.title}</p>
              <p className="text-asvo-text-dim">{nextAudit.scope}</p>
              <div className="flex justify-between pt-1 border-t border-asvo-border">
                <span className="text-asvo-text-dim">Дата: {nextAudit.plannedDate}</span>
                <span className="text-asvo-text-dim">Аудитор: {nextAudit.leadAuditor}</span>
              </div>
              <span
                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-asvo-blue-dim text-[#4A90E8]"
              >
                {nextAudit.type === "internal" ? "Внутренний" : "Внешний"}
              </span>
            </div>
          </div>
        )}

        {/* ---------- Widget: Анализ руководства (wide) ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-asvo-text mb-1 flex items-center gap-2">
              <Activity size={14} className="text-[#A78BFA]" />
              Анализ руководства — п.5.6.2
            </h3>
            <p className="text-[10px] text-asvo-text-dim mb-3">
              Следующее совещание: {managementReviewChecklist.nextReviewDate} (через {managementReviewChecklist.daysUntil} дн.)
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
              {managementReviewChecklist.readiness.map((r) => (
                <div key={r.item} className="flex items-center gap-2 text-xs">
                  {r.ready ? (
                    <CheckCircle2 size={14} className="text-[#2DD4A8] shrink-0" />
                  ) : (
                    <Circle size={14} className="text-asvo-text-dim shrink-0" />
                  )}
                  <span className={r.ready ? "text-asvo-text" : "text-asvo-text-dim"}>
                    {r.item}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-asvo-text-dim mb-1">
              Готовность: {managementReviewChecklist.completionPct}%
            </div>
            <div className="h-1.5 rounded-full bg-asvo-bg">
              <div
                className="h-1.5 rounded-full bg-[#A78BFA]"
                style={{ width: `${managementReviewChecklist.completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ---------- Widget: MES-показатели (wide) ---------- */}
        {show(false, true, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <Factory size={14} className="text-asvo-text-dim" />
              MES-показатели
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Defect rate */}
              <div>
                <span className="text-[10px] text-asvo-text-dim">% брака</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-asvo-text">{mesMetrics.defectRate}%</span>
                  <span className={`flex items-center text-xs font-semibold ${
                    mesMetrics.defectRateTrend < 0 ? "text-[#2DD4A8]" : "text-[#F06060]"
                  }`}>
                    {mesMetrics.defectRateTrend < 0 ? (
                      <TrendingDown size={12} className="mr-0.5" />
                    ) : (
                      <TrendingUp size={12} className="mr-0.5" />
                    )}
                    {Math.abs(mesMetrics.defectRateTrend)}
                  </span>
                </div>
              </div>

              {/* Yield */}
              <div>
                <span className="text-[10px] text-asvo-text-dim">Выход годных</span>
                <div className="text-2xl font-bold text-[#2DD4A8]">{mesMetrics.yieldRate}%</div>
              </div>

              {/* Line status */}
              <div>
                <span className="text-[10px] text-asvo-text-dim">Статус линии</span>
                <div className="mt-1">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${lineStatusLabel[mesMetrics.lineStatus].cls}`}
                  >
                    {lineStatusLabel[mesMetrics.lineStatus].text}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily plan progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-asvo-text-dim">
                  Дневной план: {mesMetrics.productionToday} / {mesMetrics.productionTarget}
                </span>
                <span className="text-xs font-bold text-asvo-text">
                  {Math.round((mesMetrics.productionToday / mesMetrics.productionTarget) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-asvo-bg">
                <div
                  className="h-1.5 rounded-full bg-asvo-accent"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((mesMetrics.productionToday / mesMetrics.productionTarget) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Process Map                                                */}
      {/* ---------------------------------------------------------- */}
      <ProcessMap />
    </div>
  );
};
