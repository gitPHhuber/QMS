/**
 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS (ISO 8.4)
 * Dark-theme dashboard с реальными данными из API
 */

import React, { useState, useEffect, useMemo } from "react";
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
  Crosshair,
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
import {
  dashboardApi,
  type DashboardSummary,
  type DashboardTrends,
} from "../../api/qmsApi";

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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const riskCellColor = (likelihood: number, severity: number): string => {
  const score = likelihood * severity;
  if (score <= 4)  return "bg-asvo-green-dim  text-asvo-green";
  if (score <= 9)  return "bg-asvo-amber-dim  text-asvo-amber";
  if (score <= 16) return "bg-[rgba(232,112,64,0.15)] text-asvo-orange";
  return                   "bg-asvo-red-dim    text-asvo-red";
};

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

  /* ---------- visibility helper ---------- */
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
                    const hasValue = count !== null;
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline for production_head (no risk matrix) */}
      {role === "production_head" && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                  <span className="text-xs font-bold text-asvo-amber whitespace-nowrap ml-2">{eq.daysUntil} дн.</span>
                </div>
              ))}
            </div>
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
          </div>
        )}

        {/* ---------- Widget: Обучение ---------- */}
        {show(true, true, true) && summary?.training && (
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
