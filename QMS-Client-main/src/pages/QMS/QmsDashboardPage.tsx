/**

 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS (ISO 8.4)
 * Dark-theme dashboard с реальными данными из API
 */

<<<<<<< HEAD
import React, { useEffect, useState } from "react";
=======
import React, { useState, useEffect, useMemo } from "react";

 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS
 * Dark-theme dashboard с KPI, Risk Matrix, Timeline и виджетами
 * Подключён к реальному backend API (все mock-данные заменены).
 */

import React, { useState, useEffect } from "react";

>>>>>>> origin/main
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
<<<<<<< HEAD
  Info,
=======

  Crosshair,

  Loader2,

>>>>>>> origin/main
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

<<<<<<< HEAD
import { reviewsApi } from "../../api/qmsApi";

=======
import {
  dashboardApi,
  type DashboardSummary,
  type DashboardTrends,


import {
  ncApi,
  risksApi,
  documentsApi,
  complaintsApi,
  internalAuditsApi,
  suppliersApi,
  equipmentApi,
  trainingApi,
  reviewsApi,

} from "../../api/qmsApi";
>>>>>>> origin/main

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

interface TrendPoint {
  month: string;
  nc: number;
  capa: number;
}

<<<<<<< HEAD
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

interface QualityObjectivesStatusData {
  achieved: number;
  atRisk: number;
  overdue: number;
  total: number;
}


interface TimelineEvent {
  date: string;
  code: string;
  text: string;
  dotClass: string;
  category: "nc" | "doc" | "capa" | "audit" | "risk" | "equipment";
}

=======
>>>>>>> origin/main
/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const roleTabs: { key: string; label: string }[] = [
  { key: "quality_manager", label: "Менеджер качества" },
  { key: "production_head", label: "Нач. производства" },
  { key: "director",        label: "Руководство" },
];


const MONTH_NAMES: Record<string, string> = {
  "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр",
  "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг",
  "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек",
};

const CATEGORY_DOT: Record<string, string> = {
  nc:        "bg-asvo-red",
  capa:      "bg-asvo-amber",
  doc:       "bg-asvo-blue",
  audit:     "bg-asvo-blue",
  risk:      "bg-asvo-purple",
  equipment: "bg-asvo-accent",
};

const SUPPLIER_STATUS_LABELS: Record<string, { label: string; colorClass: string }> = {
  QUALIFIED:     { label: "Одобрен",       colorClass: "bg-asvo-accent" },
  CONDITIONAL:   { label: "Условный",      colorClass: "bg-asvo-amber" },
  PENDING:       { label: "На переоценке", colorClass: "bg-asvo-blue" },
  DISQUALIFIED:  { label: "Заблокирован",  colorClass: "bg-asvo-red" },
  SUSPENDED:     { label: "Приостановлен", colorClass: "bg-asvo-red" },
};


/* ------------------------------------------------------------------ */
/*  Helpers (pure — not dependent on API data)                         */

/* ------------------------------------------------------------------ */

const riskCellColor = (likelihood: number, severity: number): string => {
  const score = likelihood * severity;
  if (score <= 4)  return "bg-asvo-green-dim  text-asvo-green";
  if (score <= 9)  return "bg-asvo-amber-dim  text-asvo-amber";
  if (score <= 16) return "bg-[rgba(232,112,64,0.15)] text-asvo-orange";
  return                   "bg-asvo-red-dim    text-asvo-red";
};

<<<<<<< HEAD
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

const TimelinePanel: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
    <h3 className="text-sm font-semibold text-asvo-text mb-3">Последние события</h3>

    <div className="relative space-y-4 pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />

      {events.map((evt, idx) => (
        <div key={idx} className="relative flex items-start gap-3">
          <div
            className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-asvo-surface-2 ${evt.dotClass}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-asvo-text-dim">{evt.date}</span>
              <span className="text-xs font-semibold text-asvo-text">{evt.code}</span>
            </div>
            <p className="text-xs text-asvo-text-mid mt-0.5 truncate">{evt.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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

=======
>>>>>>> origin/main
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

/** Empty 5x5 matrix (fallback when API unavailable). */
const emptyMatrix: (number | null)[][] = [
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
];

/* ------------------------------------------------------------------ */
/*  Helpers for extracting counts from API stats objects               */
/* ------------------------------------------------------------------ */

/**
 * Sum counts from an array of { status/type/...: string; count: string|number }
 */
const sumCounts = (arr?: Array<{ count: string | number }>): number => {
  if (!arr || !Array.isArray(arr)) return 0;
  return arr.reduce((s, i) => s + (typeof i.count === "string" ? parseInt(i.count, 10) || 0 : i.count), 0);
};

/**
 * Find the count for a specific key value inside an array of { [key]: string; count: string|number }
 */
const findCount = (
  arr: Array<Record<string, any>> | undefined,
  key: string,
  value: string,
): number => {
  if (!arr || !Array.isArray(arr)) return 0;
  const item = arr.find((i) => i[key] === value);
  if (!item) return 0;
  return typeof item.count === "string" ? parseInt(item.count, 10) || 0 : item.count;
};

/* ------------------------------------------------------------------ */
/*  Fallback / default data objects                                    */
/* ------------------------------------------------------------------ */

const defaultTimeline: TimelineEvent[] = [];

const defaultCapaEfficiency: CapaEfficiencyData = {
  closedOnTime: 0,
  closedLate: 0,
  total: 0,
  avgCloseDays: 0,
  effectivenessRate: 0,
};

const defaultComplaints: ComplaintsData = {
  open: 0,
  investigating: 0,
  closedThisMonth: 0,
  avgResponseDays: 0,
};

const defaultTrendData: TrendPoint[] = [];

const defaultDocsApproval: DocsApprovalData = {
  awaitingReview: 0,
  overdue: 0,
  avgApprovalDays: 0,
  docs: [],
};

const defaultNextAudit: NextAuditData = {
  code: "-",
  title: "Нет запланированных аудитов",
  scope: "-",
  plannedDate: "-",
  daysUntil: 0,
  leadAuditor: "-",
  type: "internal",

};

const defaultManagementReview: ManagementReviewData = {
  nextReviewDate: "-",
  daysUntil: 0,
  readiness: [],
  completionPct: 0,
};


/** "2025-03" → "Мар" */
function formatMonth(m: string): string {
  const mm = m.split("-")[1];
  return MONTH_NAMES[mm] || m;
}

/** ISO date → "DD.MM" */
function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

/** ISO date → "DD.MM.YYYY" */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Build risk matrix 5x5 from cellCounts */
function buildRiskMatrix(cellCounts: Record<string, number>): (number | null)[][] {
  const matrix: (number | null)[][] = [];
  for (let l = 5; l >= 1; l--) {
    const row: (number | null)[] = [];
    for (let s = 1; s <= 5; s++) {
      const count = cellCounts[`${l}-${s}`];
      row.push(count ? count : null);
    }
    matrix.push(row);
  }
  return matrix;
}

/** Merge NC/CAPA trend data into Recharts format */
function buildTrendData(trends: DashboardTrends | null): TrendPoint[] {
  if (!trends) return [];
  const months = new Set<string>();
  trends.nc.forEach(p => months.add(p.month));
  trends.capa.forEach(p => months.add(p.month));

  const ncMap: Record<string, number> = {};
  const capaMap: Record<string, number> = {};
  trends.nc.forEach(p => { ncMap[p.month] = p.count; });
  trends.capa.forEach(p => { capaMap[p.month] = p.count; });

  return [...months].sort().map(m => ({
    month: formatMonth(m),
    nc: ncMap[m] || 0,
    capa: capaMap[m] || 0,
  }));
}

const defaultMesMetrics: MesMetricsData = {
  defectRate: 0,
  defectRateTrend: 0,
  yieldRate: 0,
  productionToday: 0,
  productionTarget: 1,
  lineStatus: "stopped",
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
<<<<<<< HEAD
  const [qualityObjectivesStatus, setQualityObjectivesStatus] = useState<QualityObjectivesStatusData>({
    achieved: 0,
    atRisk: 0,
    overdue: 0,
    total: 0,
  });

  useEffect(() => {
    let mounted = true;

    reviewsApi
      .getDashboard()
      .then((data) => {
        if (!mounted) return;
        const status = data?.qualityObjectivesStatus;
        setQualityObjectivesStatus({
          achieved: Number(status?.achieved || 0),
          atRisk: Number(status?.atRisk || 0),
          overdue: Number(status?.overdue || 0),
          total: Number(status?.total || 0),
        });
      })
      .catch(() => {
        if (!mounted) return;
        setQualityObjectivesStatus({ achieved: 0, atRisk: 0, overdue: 0, total: 0 });
      });

    return () => {
      mounted = false;
    };
  }, []);
=======
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([dashboardApi.getSummary(), dashboardApi.getTrends()])
      .then(([s, t]) => {
        if (!cancelled) { setSummary(s); setTrends(t); }
      })
      .catch(e => {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Ошибка загрузки дашборда");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  API state                                                        */
  /* ---------------------------------------------------------------- */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ncStats, setNcStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [riskStats, setRiskStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [docStats, setDocStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [complaintStats, setComplaintStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditStats, setAuditStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [supplierStats, setSupplierStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipmentStats, setEquipmentStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trainingStats, setTrainingStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviewStats, setReviewStats] = useState<any>(null);

  const [riskMatrix, setRiskMatrix] = useState<(number | null)[][]>(emptyMatrix);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch all stats on mount                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        ncApi.getStats(),              // 0
        risksApi.getStats(),           // 1
        documentsApi.getStats(),       // 2
        complaintsApi.getStats(),      // 3
        internalAuditsApi.getStats(),  // 4
        suppliersApi.getStats(),       // 5
        equipmentApi.getStats(),       // 6
        trainingApi.getStats(),        // 7
        reviewsApi.getStats(),         // 8
        risksApi.getMatrix(),          // 9
      ]);

      if (cancelled) return;

      const val = <T,>(idx: number): T | null =>
        results[idx].status === "fulfilled" ? (results[idx] as PromiseFulfilledResult<T>).value : null;

      setNcStats(val(0));
      setRiskStats(val(1));
      setDocStats(val(2));
      setComplaintStats(val(3));
      setAuditStats(val(4));
      setSupplierStats(val(5));
      setEquipmentStats(val(6));
      setTrainingStats(val(7));
      setReviewStats(val(8));

      // Risk matrix — try to use API data, fallback to empty
      const matrixRaw = val<any>(9);
      if (matrixRaw && Array.isArray(matrixRaw.matrix)) {
        setRiskMatrix(matrixRaw.matrix);
      } else if (matrixRaw && Array.isArray(matrixRaw)) {
        setRiskMatrix(matrixRaw);
      } else {
        setRiskMatrix(emptyMatrix);
      }

      // Check if ALL requests failed
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        setError("Не удалось загрузить данные дашборда. Проверьте подключение к серверу.");
      }

      setLoading(false);
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Derived data from API stats                                      */
  /* ---------------------------------------------------------------- */

  // --- Total document count ---
  const totalDocs: number = docStats
    ? sumCounts(docStats.byStatus)
    : 0;

  // --- Open NC count (all non-CLOSED statuses) ---
  const openNcCount: number = ncStats
    ? sumCounts(
        (ncStats.ncByStatus as Array<{ status: string; count: string }>)?.filter(
          (s) => s.status !== "CLOSED",
        ),
      )
    : 0;

  // --- Active CAPA count (all non-CLOSED/EFFECTIVE/INEFFECTIVE) ---
  const activeCapaCount: number = ncStats
    ? sumCounts(
        (ncStats.capaByStatus as Array<{ status: string; count: string }>)?.filter(
          (s) => !["CLOSED", "EFFECTIVE", "INEFFECTIVE"].includes(s.status),
        ),
      )
    : 0;

  // --- Audit completion percentage ---
  const auditCompletionPct: string = auditStats?.completionRate != null
    ? `${Math.round(auditStats.completionRate)}%`
    : auditStats?.completedAudits != null && auditStats?.totalAudits
      ? `${Math.round((auditStats.completedAudits / auditStats.totalAudits) * 100)}%`
      : auditStats?.completedCount != null && auditStats?.totalCount
        ? `${Math.round((auditStats.completedCount / auditStats.totalCount) * 100)}%`
        : "0%";

  // --- Total risk count ---
  const totalRisks: number = riskStats
    ? (riskStats.total ?? sumCounts(riskStats.byStatus ?? riskStats.byLevel))
    : 0;

  // --- Open complaints ---
  const openComplaints: number = complaintStats
    ? (complaintStats.open ??
       sumCounts(
         (complaintStats.byStatus as Array<{ status: string; count: string }>)?.filter(
           (s) => s.status !== "CLOSED" && s.status !== "RESOLVED",
         ),
       ))
    : 0;

  /* ---------------------------------------------------------------- */
  /*  KPI cards (built from live data)                                 */
  /* ---------------------------------------------------------------- */

  const kpiCards: KpiCard[] = [
    { label: "Документы",     value: totalDocs,        color: "text-asvo-blue",   bgClass: "bg-asvo-blue-dim",   icon: FileText,            roles: ["quality_manager", "director"] },
    { label: "NC открытых",   value: openNcCount,      color: "text-asvo-red",    bgClass: "bg-asvo-red-dim",    icon: AlertTriangle,       roles: ["quality_manager", "production_head", "director"] },
    { label: "CAPA активных", value: activeCapaCount,  color: "text-asvo-amber",  bgClass: "bg-asvo-amber-dim",  icon: RefreshCw,           roles: ["quality_manager", "production_head", "director"] },
    { label: "Аудиты",        value: auditCompletionPct, color: "text-asvo-accent", bgClass: "bg-asvo-green-dim",  icon: ClipboardList,     roles: ["quality_manager", "director"] },
    { label: "Риски",         value: totalRisks,       color: "text-asvo-purple", bgClass: "bg-asvo-purple-dim", icon: Target,              roles: ["quality_manager", "director"] },
    { label: "Жалобы откр.",  value: openComplaints,   color: "text-asvo-amber",  bgClass: "bg-asvo-amber-dim",  icon: MessageSquareWarning, roles: ["quality_manager", "director"] },
  ];

  /* ---------------------------------------------------------------- */
  /*  Overdue CAPAs widget                                             */
  /* ---------------------------------------------------------------- */

  const overdueCapaCount: number = ncStats?.overdueCapa ?? 0;
  const overdueCapas: { code: string; text: string; days: number }[] =
    ncStats?.overdueCapaList && Array.isArray(ncStats.overdueCapaList)
      ? ncStats.overdueCapaList.map((c: any) => ({
          code: c.number ?? c.code ?? `CAPA-${c.id}`,
          text: c.title ?? c.description ?? "",
          days: c.overdueDays ?? (c.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(c.dueDate).getTime()) / 86400000)) : 0),
        }))
      : [];

  /* ---------------------------------------------------------------- */
  /*  Calibrations widget                                              */
  /* ---------------------------------------------------------------- */

  const calibrations: { code: string; name: string; days: number }[] =
    equipmentStats?.upcomingCalibrations && Array.isArray(equipmentStats.upcomingCalibrations)
      ? equipmentStats.upcomingCalibrations.map((c: any) => ({
          code: c.code ?? c.equipmentCode ?? `EQ-${c.id}`,
          name: c.name ?? c.equipmentName ?? "",
          days: c.daysUntil ?? (c.nextCalibrationDate ? Math.max(0, Math.floor((new Date(c.nextCalibrationDate).getTime() - Date.now()) / 86400000)) : 0),
        }))
      : [];

  /* ---------------------------------------------------------------- */
  /*  Supplier status widget                                           */
  /* ---------------------------------------------------------------- */

  const supplierStatus: SupplierStatusItem[] = supplierStats?.byStatus && Array.isArray(supplierStats.byStatus)
    ? supplierStats.byStatus.map((s: any) => {
        const statusLabel = s.status ?? s.qualificationStatus ?? "";
        const colorMap: Record<string, string> = {
          APPROVED: "bg-asvo-accent",
          CONDITIONAL: "bg-asvo-amber",
          UNDER_REVIEW: "bg-asvo-blue",
          PENDING: "bg-asvo-blue",
          BLOCKED: "bg-asvo-red",
          DISQUALIFIED: "bg-asvo-red",
        };
        const labelMap: Record<string, string> = {
          APPROVED: "Одобрен",
          CONDITIONAL: "Условный",
          UNDER_REVIEW: "На переоценке",
          PENDING: "На переоценке",
          BLOCKED: "Заблокирован",
          DISQUALIFIED: "Заблокирован",
        };
        return {
          status: labelMap[statusLabel] ?? statusLabel,
          count: typeof s.count === "string" ? parseInt(s.count, 10) || 0 : (s.count ?? 0),
          colorClass: colorMap[statusLabel] ?? "bg-asvo-text-dim",
        };
      })
    : [];

  const supplierTotal = supplierStatus.reduce((s, i) => s + i.count, 0) || 1;
  const supplierApprovedCount = supplierStatus.length > 0
    ? (supplierStatus.find((s) => s.status === "Одобрен")?.count ?? 0)
    : 0;
  const supplierApprovedPct = Math.round((supplierApprovedCount / supplierTotal) * 100);

  /* ---------------------------------------------------------------- */
  /*  CAPA efficiency widget                                           */
  /* ---------------------------------------------------------------- */

  const capaEfficiency: CapaEfficiencyData = ncStats?.capaEfficiency
    ? {
        closedOnTime: ncStats.capaEfficiency.closedOnTime ?? 0,
        closedLate: ncStats.capaEfficiency.closedLate ?? 0,
        total: ncStats.capaEfficiency.total ?? 0,
        avgCloseDays: ncStats.capaEfficiency.avgCloseDays ?? 0,
        effectivenessRate: ncStats.capaEfficiency.effectivenessRate ?? 0,
      }
    : (() => {
        // Derive basic efficiency from capaByStatus if available
        const closedCount = ncStats
          ? findCount(ncStats.capaByStatus, "status", "CLOSED") +
            findCount(ncStats.capaByStatus, "status", "EFFECTIVE")
          : 0;
        const lateCount = ncStats
          ? findCount(ncStats.capaByStatus, "status", "INEFFECTIVE")
          : 0;
        const total = closedCount + lateCount;
        return {
          closedOnTime: closedCount,
          closedLate: lateCount,
          total,
          avgCloseDays: 0,
          effectivenessRate: total > 0 ? Math.round((closedCount / total) * 100) : 0,
        };
      })();

  /* ---------------------------------------------------------------- */
  /*  Complaints widget                                                */
  /* ---------------------------------------------------------------- */

  const complaints: ComplaintsData = complaintStats
    ? {
        open: complaintStats.open ?? findCount(complaintStats.byStatus, "status", "OPEN"),
        investigating: complaintStats.investigating ?? findCount(complaintStats.byStatus, "status", "INVESTIGATING"),
        closedThisMonth: complaintStats.closedThisMonth ?? findCount(complaintStats.byStatus, "status", "CLOSED"),
        avgResponseDays: complaintStats.avgResponseDays ?? 0,
      }
    : defaultComplaints;

  /* ---------------------------------------------------------------- */
  /*  NC/CAPA Trend data                                               */
  /* ---------------------------------------------------------------- */

  const trendData: TrendPoint[] =
    ncStats?.monthlyTrend && Array.isArray(ncStats.monthlyTrend)
      ? ncStats.monthlyTrend.map((t: any) => ({
          month: t.month ?? t.label ?? "",
          nc: typeof t.nc === "string" ? parseInt(t.nc, 10) || 0 : (t.nc ?? 0),
          capa: typeof t.capa === "string" ? parseInt(t.capa, 10) || 0 : (t.capa ?? 0),
        }))
      : defaultTrendData;

  /* ---------------------------------------------------------------- */
  /*  Docs approval widget                                             */
  /* ---------------------------------------------------------------- */

  const docsApproval: DocsApprovalData = docStats
    ? {
        awaitingReview: docStats.pendingApprovalsCount ?? 0,
        overdue: docStats.overdueCount ?? 0,
        avgApprovalDays: docStats.avgApprovalDays ?? 0,
        docs: docStats.pendingDocs && Array.isArray(docStats.pendingDocs)
          ? docStats.pendingDocs.map((d: any) => ({
              code: d.code ?? `DOC-${d.id}`,
              title: d.title ?? "",
              days: d.days ?? (d.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000)) : 0),
              status: d.status === "overdue" || (d.dueDate && new Date(d.dueDate) < new Date()) ? "overdue" as const : "pending" as const,
            }))
          : [],
      }
    : defaultDocsApproval;

  /* ---------------------------------------------------------------- */
  /*  Next audit widget                                                */
  /* ---------------------------------------------------------------- */

  const nextAudit: NextAuditData = auditStats?.nextAudit
    ? {
        code: auditStats.nextAudit.code ?? auditStats.nextAudit.auditNumber ?? "-",
        title: auditStats.nextAudit.title ?? auditStats.nextAudit.name ?? "",
        scope: auditStats.nextAudit.scope ?? "",
        plannedDate: auditStats.nextAudit.plannedDate ?? auditStats.nextAudit.scheduledDate ?? "-",
        daysUntil: auditStats.nextAudit.daysUntil ??
          (auditStats.nextAudit.scheduledDate
            ? Math.max(0, Math.floor((new Date(auditStats.nextAudit.scheduledDate).getTime() - Date.now()) / 86400000))
            : 0),
        leadAuditor: auditStats.nextAudit.leadAuditor ??
          (auditStats.nextAudit.auditor
            ? `${auditStats.nextAudit.auditor.name ?? ""} ${auditStats.nextAudit.auditor.surname ?? ""}`
            : "-"),
        type: auditStats.nextAudit.type === "external" ? "external" : "internal",
      }
    : defaultNextAudit;

  /* ---------------------------------------------------------------- */
  /*  Management review widget                                         */
  /* ---------------------------------------------------------------- */

  const managementReviewChecklist: ManagementReviewData = reviewStats?.nextReview
    ? {
        nextReviewDate: reviewStats.nextReview.date ?? reviewStats.nextReview.nextReviewDate ?? "-",
        daysUntil: reviewStats.nextReview.daysUntil ??
          (reviewStats.nextReview.date
            ? Math.max(0, Math.floor((new Date(reviewStats.nextReview.date).getTime() - Date.now()) / 86400000))
            : 0),
        readiness: reviewStats.nextReview.readiness && Array.isArray(reviewStats.nextReview.readiness)
          ? reviewStats.nextReview.readiness.map((r: any) => ({
              item: r.item ?? r.name ?? "",
              ready: !!r.ready,
            }))
          : [],
        completionPct: reviewStats.nextReview.completionPct ?? reviewStats.nextReview.readinessPercent ?? 0,
      }
    : defaultManagementReview;

  /* ---------------------------------------------------------------- */
  /*  MES metrics widget                                               */
  /* ---------------------------------------------------------------- */

  const mesMetrics: MesMetricsData = equipmentStats?.mesMetrics
    ? {
        defectRate: equipmentStats.mesMetrics.defectRate ?? 0,
        defectRateTrend: equipmentStats.mesMetrics.defectRateTrend ?? 0,
        yieldRate: equipmentStats.mesMetrics.yieldRate ?? 0,
        productionToday: equipmentStats.mesMetrics.productionToday ?? 0,
        productionTarget: equipmentStats.mesMetrics.productionTarget || 1,
        lineStatus: equipmentStats.mesMetrics.lineStatus ?? "stopped",
      }
    : defaultMesMetrics;

  /* ---------------------------------------------------------------- */
  /*  Training widget                                                  */
  /* ---------------------------------------------------------------- */

  const trainingDepts: { dept: string; pct: number; barClass: string }[] =
    trainingStats?.byDepartment && Array.isArray(trainingStats.byDepartment)
      ? trainingStats.byDepartment.map((d: any) => {
          const pct = typeof d.completionPercent === "number"
            ? d.completionPercent
            : typeof d.pct === "number"
              ? d.pct
              : 0;
          let barClass = "bg-asvo-red";
          if (pct >= 80) barClass = "bg-asvo-accent";
          else if (pct >= 60) barClass = "bg-asvo-blue";
          else if (pct >= 40) barClass = "bg-asvo-amber";
          return {
            dept: d.department ?? d.dept ?? d.name ?? "",
            pct: Math.round(pct),
            barClass,
          };
        })
      : [];

  /* ---------------------------------------------------------------- */
  /*  Timeline events                                                  */
  /* ---------------------------------------------------------------- */

  const timelineEvents: TimelineEvent[] =
    ncStats?.recentEvents && Array.isArray(ncStats.recentEvents)
      ? ncStats.recentEvents.map((evt: any) => {
          const categoryMap: Record<string, TimelineEvent["category"]> = {
            NC: "nc",
            CAPA: "capa",
            DOC: "doc",
            AUDIT: "audit",
            RISK: "risk",
            EQUIPMENT: "equipment",
          };
          const dotMap: Record<string, string> = {
            nc: "bg-asvo-red",
            capa: "bg-asvo-amber",
            doc: "bg-asvo-blue",
            audit: "bg-asvo-blue",
            risk: "bg-asvo-purple",
            equipment: "bg-asvo-text-dim",
          };
          const cat = categoryMap[evt.category?.toUpperCase?.()] ?? (evt.category as TimelineEvent["category"]) ?? "nc";
          return {
            date: evt.date ?? "",
            code: evt.code ?? evt.number ?? "",
            text: evt.text ?? evt.title ?? evt.description ?? "",
            dotClass: dotMap[cat] ?? "bg-asvo-text-dim",
            category: cat,
          };
        })
      : defaultTimeline;

  /* ---------------------------------------------------------------- */
  /*  Visibility helper                                                */
  /* ---------------------------------------------------------------- */
>>>>>>> origin/main

  const show = (qm: boolean, ph: boolean, dir: boolean): boolean => {
    switch (role) {
      case "quality_manager": return qm;
      case "production_head": return ph;
      case "director":        return dir;
    }
  };

  /* ---------- derived data ---------- */
  const kpiCards: KpiCard[] = useMemo(() => {
    if (!summary) return [];
    const cards: KpiCard[] = [];

    if (summary.documents) {
      cards.push({
        label: "Документы на согл.", value: summary.documents.awaitingReview,
        color: "text-asvo-blue", bgClass: "bg-asvo-blue-dim",
        icon: FileText, roles: ["quality_manager", "director"],
      });
    }
    if (summary.nc) {
      cards.push({
        label: "NC открытых", value: summary.nc.openCount,
        color: "text-asvo-red", bgClass: "bg-asvo-red-dim",
        icon: AlertTriangle, roles: ["quality_manager", "production_head", "director"],
      });
    }
    if (summary.capa) {
      cards.push({
        label: "CAPA активных", value: summary.capa.activeCount,
        color: "text-asvo-amber", bgClass: "bg-asvo-amber-dim",
        icon: RefreshCw, roles: ["quality_manager", "production_head", "director"],
      });
    }
    if (summary.audits) {
      cards.push({
        label: "Откр. замечания", value: summary.audits.openFindings,
        color: "text-asvo-accent", bgClass: "bg-asvo-green-dim",
        icon: ClipboardList, roles: ["quality_manager", "director"],
      });
    }
    if (summary.risks) {
      const total = Object.values(summary.risks.byClass).reduce((a, b) => a + b, 0);
      cards.push({
        label: "Риски", value: total,
        color: "text-asvo-purple", bgClass: "bg-asvo-purple-dim",
        icon: Target, roles: ["quality_manager", "director"],
      });
    }
    if (summary.complaints) {
      cards.push({
        label: "Жалобы откр.", value: summary.complaints.open,
        color: "text-asvo-amber", bgClass: "bg-asvo-amber-dim",
        icon: MessageSquareWarning, roles: ["quality_manager", "director"],
      });
    }
    return cards;
  }, [summary]);

  const riskMatrix = useMemo(() => {
    if (!summary?.risks) return null;
    return buildRiskMatrix(summary.risks.cellCounts);
  }, [summary]);

  const trendData = useMemo(() => buildTrendData(trends), [trends]);


  const timelineEvents = useMemo(() => {
    if (!summary?.timeline) return [];
    return summary.timeline.map(evt => ({
      ...evt,
      shortDate: formatShortDate(evt.date),
      dotClass: CATEGORY_DOT[evt.category] || "bg-asvo-text-dim",
    }));
  }, [summary]);

  const filteredKpi = kpiCards.filter(k => k.roles.includes(role));

  const filteredEvents = role === "production_head"
    ? timelineEvents.filter(e => e.category === "nc" || e.category === "equipment")
    : timelineEvents;

  const kpiGridCols =
    filteredKpi.length <= 2 ? "lg:grid-cols-2"
    : filteredKpi.length <= 3 ? "lg:grid-cols-3"
    : filteredKpi.length <= 5 ? "lg:grid-cols-5"
    : "lg:grid-cols-6";

  const likelihoodLabels = [5, 4, 3, 2, 1];
  const severityLabels   = [1, 2, 3, 4, 5];

  /* ---------- Loading / Error ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">
        <TabBar tabs={roleTabs} active={role} onChange={(key) => setRole(key as DashboardRole)} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-64" />
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-64" />
        </div>
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 animate-pulse h-72" />

  /* ---------- risk matrix helpers ---------- */

  // Rows are stored top-to-bottom (likelihood 5 -> 1)
  const likelihoodLabels = [5, 4, 3, 2, 1];
  const severityLabels   = [1, 2, 3, 4, 5];

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-asvo-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-asvo-accent animate-spin" />
          <span className="text-sm text-asvo-text-dim">Загрузка дашборда...</span>
        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-asvo-bg px-4 py-6 flex items-center justify-center">
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6 text-center max-w-md">
          <AlertTriangle size={32} className="text-asvo-red mx-auto mb-3" />
          <p className="text-sm text-asvo-red mb-2">Ошибка загрузки дашборда</p>
          <p className="text-xs text-asvo-text-dim">{error}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-asvo-bg px-4 py-6 max-w-[1600px] mx-auto space-y-6">

      {/* ---------------------------------------------------------- */}
      {/*  Error banner                                               */}
      {/* ---------------------------------------------------------- */}
      {error && (
        <div className="bg-asvo-red-dim border border-asvo-red/30 rounded-xl p-4 text-sm text-asvo-red">
          {error}
        </div>
      )}

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
      {show(true, false, true) && riskMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ---------- Risk Matrix 5x5 ---------- */}
          <div className="lg:col-span-2 bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Матрица рисков 5 x 5
            </h3>

            <div className="grid grid-cols-6 gap-1 mb-1">
              <div />
              {severityLabels.map((s) => (
                <div key={s} className="text-[10px] text-asvo-text-dim text-center">S{s}</div>
              ))}
            </div>

            {riskMatrix.map((row, rowIdx) => {
              const likelihood = likelihoodLabels[rowIdx];
              return (
                <div key={likelihood} className="grid grid-cols-6 gap-1 mb-1">
                  <div className="flex items-center justify-center text-[10px] text-asvo-text-dim">
                    L{likelihood}
                  </div>
                  {row.map((count, colIdx) => {
                    const severity = severityLabels[colIdx];

                    const hasValue = count !== null && count !== 0;


                    return (
                      <div
                        key={`${likelihood}-${severity}`}
                        className={`h-10 rounded flex items-center justify-center text-xs font-semibold ${
                          hasValue ? riskCellColor(likelihood, severity) : "bg-asvo-surface"
                        }`}
                      >
                        {hasValue ? count : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div className="flex items-center gap-4 mt-3">
              {[
                { label: "Низкий <=4",  cls: "bg-asvo-green-dim" },
                { label: "Средний <=9", cls: "bg-asvo-amber-dim" },
                { label: "Высокий <=16", cls: "bg-[rgba(232,112,64,0.15)]" },
                { label: "Крит. >16",   cls: "bg-asvo-red-dim" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${l.cls}`} />
                  <span className="text-[10px] text-asvo-text-dim">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Timeline ---------- */}
<<<<<<< HEAD
          <TimelinePanel events={timelineEvents} />
=======
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Последние события
            </h3>


            <div className="relative space-y-4 pl-5">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />
              {timelineEvents.slice(0, 8).map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-asvo-surface-2 ${evt.dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-asvo-text-dim">{evt.shortDate}</span>
                      <span className="text-xs font-semibold text-asvo-text">{evt.code}</span>
                    </div>
                    <p className="text-xs text-asvo-text-mid mt-0.5 truncate">{evt.text}</p>

            {timelineEvents.length === 0 ? (
              <p className="text-xs text-asvo-text-dim">
                {loading ? "Загрузка..." : "Нет событий"}
              </p>
            ) : (
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
            )}
          </div>
>>>>>>> origin/main
        </div>
      )}

      {/* Timeline for production_head (no risk matrix) */}
      {role === "production_head" && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
<<<<<<< HEAD
          {/* ---------- Timeline (filtered) ---------- */}
          <TimelinePanel events={filteredEvents} />
=======
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">

            <h3 className="text-sm font-semibold text-asvo-text mb-3">Последние события</h3>
            <div className="relative space-y-4 pl-5">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />
              {filteredEvents.slice(0, 8).map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-asvo-surface-2 ${evt.dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-asvo-text-dim">{evt.shortDate}</span>
                      <span className="text-xs font-semibold text-asvo-text">{evt.code}</span>
                    </div>
                    <p className="text-xs text-asvo-text-mid mt-0.5 truncate">{evt.text}</p>

            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Последние события
            </h3>

            {filteredEvents.length === 0 ? (
              <p className="text-xs text-asvo-text-dim">
                {loading ? "Загрузка..." : "Нет событий"}
              </p>
            ) : (
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
            )}
          </div>
>>>>>>> origin/main
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  NC / CAPA Trends (12 months)                               */}
      {/* ---------------------------------------------------------- */}
      {show(true, true, true) && trendData.length > 0 && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-4">
            Тренды NC / CAPA (12 мес.)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<TrendTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#6B7280" }} formatter={(v: string) => (v === "nc" ? "NC" : "CAPA")} />
              <Line type="monotone" dataKey="nc" stroke="#F06060" strokeWidth={2} dot={{ r: 3, fill: "#F06060" }} activeDot={{ r: 5 }} name="nc" />
              <Line type="monotone" dataKey="capa" stroke="#E8A830" strokeWidth={2} dot={{ r: 3, fill: "#E8A830" }} activeDot={{ r: 5 }} name="capa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Quality Objectives — ISO 6.2                               */}
      {/* ---------------------------------------------------------- */}
      {show(true, false, true) && summary?.qualityObjectives && summary.qualityObjectives.length > 0 && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-asvo-text mb-4 flex items-center gap-2">
            <Crosshair size={14} className="text-[#A78BFA]" />
            Цели в области качества — п. 6.2
          </h3>
          <div className="space-y-3">
            {summary.qualityObjectives.map((qo) => (
              <div key={qo.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-asvo-text">{qo.number}</span>
                    <span className="text-xs text-asvo-text-mid truncate">{qo.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      qo.status === "ACHIEVED" ? "bg-asvo-green-dim text-[#2DD4A8]"
                      : qo.status === "NOT_ACHIEVED" ? "bg-asvo-red-dim text-[#F06060]"
                      : "bg-asvo-blue-dim text-[#4A90E8]"
                    }`}>{
                      qo.status === "ACTIVE" ? "Активна"
                      : qo.status === "ACHIEVED" ? "Достигнута"
                      : qo.status === "NOT_ACHIEVED" ? "Не достигнута"
                      : "Отменена"
                    }</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-asvo-bg">
                      <div
                        className={`h-1.5 rounded-full ${
                          qo.progress >= 100 ? "bg-asvo-accent"
                          : qo.progress >= 50 ? "bg-asvo-blue"
                          : "bg-asvo-amber"
                        }`}
                        style={{ width: `${Math.min(100, qo.progress)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-asvo-text-dim w-8 text-right">{qo.progress}%</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-asvo-text-dim">
                    <span>Метрика: {qo.metric}</span>
                    <span>Цель: {qo.targetValue}{qo.unit || ""}</span>
                    <span>Текущ.: {qo.currentValue ?? "\u2014"}{qo.unit || ""}</span>
                    {qo.dueDate && <span>Срок: {formatDate(qo.dueDate)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Bottom widgets grid                                        */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ---------- Widget: Просроченные CAPA ---------- */}
        {show(true, false, true) && summary?.capa && summary.capa.overdueItems.length > 0 && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">

            <h3 className="text-sm font-semibold text-asvo-text mb-3">Просроченные CAPA</h3>
            <div className="space-y-3">
              {summary.capa.overdueItems.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock size={14} className="text-asvo-red shrink-0" />
                    <span className="text-xs font-semibold text-asvo-red">{c.number}</span>
                    <span className="text-xs text-asvo-text-mid truncate">{c.title}</span>
                  </div>
                  <span className="text-xs font-bold text-asvo-red whitespace-nowrap ml-2">{c.overdueDays}дн</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Просроченные CAPA
            </h3>

            {overdueCapas.length > 0 ? (
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
            ) : (
              <div className="text-xs text-asvo-text-dim">
                {overdueCapaCount > 0
                  ? `Просрочено: ${overdueCapaCount}`
                  : "Нет просроченных CAPA"}
              </div>
            )}

          </div>
        )}

        {/* ---------- Widget: Эффективность CAPA ---------- */}
        {show(true, false, true) && summary?.capa && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3">Эффективность CAPA</h3>
            <div className={`text-3xl font-bold mb-3 ${effColor(summary.capa.effectivenessRate)}`}>
              {summary.capa.effectivenessRate}%
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Активных</span>
                <span className="font-semibold text-asvo-text">{summary.capa.activeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Просрочено</span>
                <span className="font-semibold text-[#F06060]">{summary.capa.overdueCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Ср. время закрытия</span>
                <span className="font-semibold text-asvo-text">{summary.capa.avgCloseDays} дн.</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Widget: Ближайшие калибровки ---------- */}
        {show(true, true, false) && summary?.equipment && summary.equipment.upcomingCalibrations.length > 0 && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">

            <h3 className="text-sm font-semibold text-asvo-text mb-3">Ближайшие калибровки</h3>
            <div className="space-y-3">
              {summary.equipment.upcomingCalibrations.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp size={14} className="text-asvo-text-dim shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-asvo-text">{eq.inventoryNumber}</span>
                      <span className="text-xs text-asvo-text-mid ml-1.5 truncate">{eq.name}</span>

            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Ближайшие калибровки
            </h3>

            {calibrations.length > 0 ? (
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
                      {eq.days} дня
                    </span>
                  </div>

                  <span className="text-xs font-bold text-asvo-amber whitespace-nowrap ml-2">{eq.daysUntil} дн.</span>
                </div>
              ))}
            </div>

                ))}
              </div>
            ) : (
              <p className="text-xs text-asvo-text-dim">Нет предстоящих калибровок</p>
            )}

          </div>
        )}

        {/* ---------- Widget: Поставщики ---------- */}
        {show(true, false, true) && summary?.suppliers && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <Truck size={14} className="text-asvo-text-dim" />
              Поставщики
            </h3>

            <div className="space-y-2 mb-3">
              {Object.entries(summary.suppliers.byStatus).map(([status, count]) => {
                const meta = SUPPLIER_STATUS_LABELS[status] || { label: status, colorClass: "bg-asvo-text-dim" };
                return (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${meta.colorClass}`} />
                      <span className="text-asvo-text-mid">{meta.label}</span>
                    </div>
                    <span className="font-semibold text-asvo-text">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-asvo-text-dim mb-1">
              Одобрено: {summary.suppliers.approvedPct}%
            </div>
            <div className="h-1.5 rounded-full bg-asvo-bg">
              <div className="h-1.5 rounded-full bg-asvo-accent" style={{ width: `${summary.suppliers.approvedPct}%` }} />
            </div>


            {supplierStatus.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-xs text-asvo-text-dim">Нет данных о поставщиках</p>
            )}

          </div>
        )}

<<<<<<< HEAD
        {/* ---------- Widget: Статус целей качества ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <Target size={14} className="text-asvo-text-dim" />
              Статус целей качества
            </h3>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#2DD4A8]">Достигнуто</span>
                <span className="font-semibold text-asvo-text">{qualityObjectivesStatus.achieved}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#E8A830]">В риске</span>
                <span className="font-semibold text-asvo-text">{qualityObjectivesStatus.atRisk}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F06060]">Просрочено</span>
                <span className="font-semibold text-asvo-text">{qualityObjectivesStatus.overdue}</span>
              </div>
            </div>

            <p
              className="text-[10px] text-asvo-text-dim leading-4"
              title="Критерии: достигнуто — факт выполнения/статус COMPLETED(ACHIEVED); в риске — дедлайн в ближайшие 30 дней без завершения; просрочено — дедлайн прошел или статус OVERDUE."
            >
              <Info size={11} className="inline mr-1" />
              Критерии: «достигнуто» — выполнено; «в риске» — дедлайн ≤ 30 дней; «просрочено» — дедлайн прошёл.
            </p>
          </div>
        )}

        {/* ---------- Widget: Обучение по отделам ---------- */}
        {show(true, true, true) && (
=======
        {/* ---------- Widget: Обучение ---------- */}
        {show(true, true, true) && summary?.training && (
>>>>>>> origin/main
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">

            <h3 className="text-sm font-semibold text-asvo-text mb-3">Обучение</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Завершено</span>
                <span className="font-semibold text-[#2DD4A8]">{summary.training.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Запланировано</span>
                <span className="font-semibold text-asvo-text">{summary.training.planned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Просрочено</span>
                <span className="font-semibold text-[#F06060]">{summary.training.expired}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-asvo-text mb-3">
              Обучение по отделам
            </h3>

            {trainingDepts.length > 0 ? (
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
            ) : (
              <p className="text-xs text-asvo-text-dim">Нет данных по обучению</p>
            )}

          </div>
        )}

        {/* ---------- Widget: Документы на согласовании ---------- */}
        {show(true, false, true) && summary?.documents && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <FileCheck size={14} className="text-asvo-text-dim" />
              Документы на согласовании
            </h3>
            <div className="flex gap-3 mb-3 text-xs">
              <div>
                <span className="text-asvo-text-dim">Ожидают: </span>
                <span className="font-semibold text-asvo-text">{summary.documents.awaitingReview}</span>
              </div>
              <div>
                <span className="text-asvo-text-dim">Просрочено: </span>
                <span className="font-semibold text-[#F06060]">{summary.documents.overdue}</span>
              </div>
            </div>


            {docsApproval.docs.length > 0 ? (
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
            ) : (
              <p className="text-xs text-asvo-text-dim">Нет документов на согласовании</p>
            )}

          </div>
        )}

        {/* ---------- Widget: Жалобы / Обратная связь ---------- */}
        {show(true, false, true) && summary?.complaints && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <MessageSquareWarning size={14} className="text-[#E8A830]" />
              Жалобы / Обратная связь
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Открытые</span>
                <span className="font-semibold text-[#E8A830]">{summary.complaints.open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">На расследовании</span>
                <span className="font-semibold text-asvo-text">{summary.complaints.investigating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Закрыто за месяц</span>
                <span className="font-semibold text-[#2DD4A8]">{summary.complaints.closedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-asvo-text-mid">Ср. время ответа</span>
                <span className="font-semibold text-asvo-text">{summary.complaints.avgResponseDays} дн.</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Widget: Ближайший аудит ---------- */}
        {show(true, false, true) && summary?.audits?.next && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <ClipboardCheck size={14} className="text-asvo-text-dim" />
              Ближайший аудит
            </h3>
            <div className="space-y-2 text-xs">
              {(() => {
                const a = summary.audits!.next;
                const daysUntil = Math.ceil((new Date(a.plannedDate).getTime() - Date.now()) / 86400000);
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-asvo-text">{a.auditNumber}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${auditDaysBadge(daysUntil)}`}>
                        {daysUntil} дн.
                      </span>
                    </div>
                    <p className="text-asvo-text-mid">{a.title}</p>
                    {a.scope && <p className="text-asvo-text-dim">{a.scope}</p>}
                    <div className="flex justify-between pt-1 border-t border-asvo-border">
                      <span className="text-asvo-text-dim">Дата: {formatDate(a.plannedDate)}</span>
                    </div>
                    <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-asvo-blue-dim text-[#4A90E8]">
                      Внутренний
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ---------- Widget: Анализ руководства (wide) ---------- */}
        {show(true, false, true) && summary?.review && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-asvo-text mb-1 flex items-center gap-2">
              <Activity size={14} className="text-[#A78BFA]" />
              Анализ руководства — п.5.6.2
            </h3>

            {summary.review.next ? (
              <>
                <p className="text-[10px] text-asvo-text-dim mb-3">
                  Следующее совещание: {formatDate(summary.review.next.reviewDate)}
                  {summary.review.daysUntil !== null && ` (через ${summary.review.daysUntil} дн.)`}
                </p>
                <div className="text-[10px] text-asvo-text-dim mb-1">
                  Выполнение решений: {summary.review.readinessPercent}%
                </div>
                <div className="h-1.5 rounded-full bg-asvo-bg">
                  <div
                    className="h-1.5 rounded-full bg-[#A78BFA]"
                    style={{ width: `${summary.review.readinessPercent}%` }}
                  />

            <p className="text-[10px] text-asvo-text-dim mb-3">
              Следующее совещание: {managementReviewChecklist.nextReviewDate} (через {managementReviewChecklist.daysUntil} дн.)
            </p>

            {managementReviewChecklist.readiness.length > 0 ? (
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
            ) : (
              <p className="text-xs text-asvo-text-dim mb-3">Нет данных о готовности</p>
            )}

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
              </>
            ) : (
              <p className="text-xs text-asvo-text-dim mt-2">Нет запланированных совещаний</p>
            )}
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
