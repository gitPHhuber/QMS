import React from "react";
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Target,
  Clock,
  TrendingUp,
  Truck,
  MessageSquareWarning,
  FileCheck,
  ClipboardCheck,
  Activity,
  Crosshair,
} from "lucide-react";
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
import type { DashboardSummary } from "../../../api/qmsApi";
import type { KpiCard, TrendPoint, DashboardRole } from "./types";
import { CATEGORY_DOT, SUPPLIER_STATUS_LABELS } from "./constants";
import { riskCellColor, effColor, auditDaysBadge, formatDate, formatShortDate } from "./helpers";

/* ------------------------------------------------------------------ */
/*  KPI Cards                                                          */
/* ------------------------------------------------------------------ */

export function buildKpiCards(summary: DashboardSummary): KpiCard[] {
  const cards: KpiCard[] = [];
  if (summary.documents) {
    cards.push({ label: "Документы на согл.", value: summary.documents.awaitingReview, color: "text-asvo-blue", bgClass: "bg-asvo-blue-dim", icon: FileText, roles: ["quality_manager", "director"] });
  }
  if (summary.nc) {
    cards.push({ label: "NC открытых", value: summary.nc.openCount, color: "text-asvo-red", bgClass: "bg-asvo-red-dim", icon: AlertTriangle, roles: ["quality_manager", "production_head", "director"] });
  }
  if (summary.capa) {
    cards.push({ label: "CAPA активных", value: summary.capa.activeCount, color: "text-asvo-amber", bgClass: "bg-asvo-amber-dim", icon: RefreshCw, roles: ["quality_manager", "production_head", "director"] });
  }
  if (summary.audits) {
    cards.push({ label: "Откр. замечания", value: summary.audits.openFindings, color: "text-asvo-accent", bgClass: "bg-asvo-green-dim", icon: ClipboardList, roles: ["quality_manager", "director"] });
  }
  if (summary.risks) {
    const total = Object.values(summary.risks.byClass).reduce((a, b) => a + b, 0);
    cards.push({ label: "Риски", value: total, color: "text-asvo-purple", bgClass: "bg-asvo-purple-dim", icon: Target, roles: ["quality_manager", "director"] });
  }
  if (summary.complaints) {
    cards.push({ label: "Жалобы откр.", value: summary.complaints.open, color: "text-asvo-amber", bgClass: "bg-asvo-amber-dim", icon: MessageSquareWarning, roles: ["quality_manager", "director"] });
  }
  return cards;
}

export const KpiCardsGrid: React.FC<{ cards: KpiCard[]; role: DashboardRole }> = ({ cards, role }) => {
  const filtered = cards.filter(k => k.roles.includes(role));
  const cols =
    filtered.length <= 2 ? "lg:grid-cols-2"
    : filtered.length <= 3 ? "lg:grid-cols-3"
    : filtered.length <= 5 ? "lg:grid-cols-5"
    : "lg:grid-cols-6";

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${cols} gap-3`}>
      {filtered.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
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
  );
};

/* ------------------------------------------------------------------ */
/*  Risk Matrix 5x5                                                    */
/* ------------------------------------------------------------------ */

export const RiskMatrixWidget: React.FC<{ matrix: (number | null)[][] }> = ({ matrix }) => {
  const likelihoodLabels = [5, 4, 3, 2, 1];
  const severityLabels = [1, 2, 3, 4, 5];

  return (
    <div className="lg:col-span-2 bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-asvo-text mb-3">Матрица рисков 5 x 5</h3>
      <div className="grid grid-cols-6 gap-1 mb-1">
        <div />
        {severityLabels.map((s) => (
          <div key={s} className="text-[10px] text-asvo-text-dim text-center">S{s}</div>
        ))}
      </div>
      {matrix.map((row, rowIdx) => {
        const likelihood = likelihoodLabels[rowIdx];
        return (
          <div key={likelihood} className="grid grid-cols-6 gap-1 mb-1">
            <div className="flex items-center justify-center text-[10px] text-asvo-text-dim">L{likelihood}</div>
            {row.map((count, colIdx) => {
              const severity = severityLabels[colIdx];
              const hasValue = count !== null && count !== 0;
              return (
                <div
                  key={`${likelihood}-${severity}`}
                  className={`h-10 rounded flex items-center justify-center text-xs font-semibold ${hasValue ? riskCellColor(likelihood, severity) : "bg-asvo-surface"}`}
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
  );
};

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

interface TimelineEvent {
  date: string;
  code: string;
  text: string;
  category: string;
  shortDate: string;
  dotClass: string;
}

export function buildTimelineEvents(summary: DashboardSummary): TimelineEvent[] {
  if (!summary.timeline) return [];
  return summary.timeline.map(evt => ({
    ...evt,
    shortDate: formatShortDate(evt.date),
    dotClass: CATEGORY_DOT[evt.category] || "bg-asvo-text-dim",
  }));
}

export const TimelineWidget: React.FC<{ events: TimelineEvent[]; maxItems?: number }> = ({ events, maxItems = 8 }) => (
  <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
    <h3 className="text-sm font-semibold text-asvo-text mb-3">Последние события</h3>
    {events.length === 0 ? (
      <p className="text-xs text-asvo-text-dim">Нет событий</p>
    ) : (
      <div className="relative space-y-4 pl-5">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-asvo-border" />
        {events.slice(0, maxItems).map((evt, idx) => (
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
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Trend Chart                                                        */
/* ------------------------------------------------------------------ */

const TrendTooltipContent: React.FC<{
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "#1A2332", borderColor: "#2D3748" }}>
      <p className="text-asvo-text-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "nc" ? "NC" : "CAPA"}: {p.value}
        </p>
      ))}
    </div>
  );
};

export const TrendChartWidget: React.FC<{ data: TrendPoint[] }> = ({ data }) => (
  <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
    <h3 className="text-sm font-semibold text-asvo-text mb-4">Тренды NC / CAPA (12 мес.)</h3>
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
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
);

/* ------------------------------------------------------------------ */
/*  Quality Objectives                                                 */
/* ------------------------------------------------------------------ */

export const QualityObjectivesWidget: React.FC<{
  summary: DashboardSummary;
  onObjectiveClick?: (id: number) => void;
}> = ({ summary, onObjectiveClick }) => {
  if (!summary.qualityObjectives || summary.qualityObjectives.length === 0) return null;
  return (
    <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-asvo-text mb-4 flex items-center gap-2">
        <Crosshair size={14} className="text-[#A78BFA]" />
        Цели в области качества — п. 6.2
      </h3>
      <div className="space-y-3">
        {summary.qualityObjectives.map((qo) => (
          <div
            key={qo.id}
            className="flex items-center gap-4 cursor-pointer hover:bg-asvo-surface rounded-lg px-2 py-1 -mx-2 transition-colors"
            onClick={() => onObjectiveClick?.(qo.id)}
          >
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
  );
};

/* ------------------------------------------------------------------ */
/*  Overdue CAPA                                                       */
/* ------------------------------------------------------------------ */

export const OverdueCapaWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.capa || summary.capa.overdueItems.length === 0) return null;
  return (
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
  );
};

/* ------------------------------------------------------------------ */
/*  CAPA Efficiency                                                    */
/* ------------------------------------------------------------------ */

export const CapaEfficiencyWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.capa) return null;
  return (
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
  );
};

/* ------------------------------------------------------------------ */
/*  Calibrations                                                       */
/* ------------------------------------------------------------------ */

export const CalibrationsWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.equipment || summary.equipment.upcomingCalibrations.length === 0) return null;
  return (
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
  );
};

/* ------------------------------------------------------------------ */
/*  Suppliers                                                          */
/* ------------------------------------------------------------------ */

export const SuppliersWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.suppliers) return null;
  return (
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
      <div className="text-[10px] text-asvo-text-dim mb-1">Одобрено: {summary.suppliers.approvedPct}%</div>
      <div className="h-1.5 rounded-full bg-asvo-bg">
        <div className="h-1.5 rounded-full bg-asvo-accent" style={{ width: `${summary.suppliers.approvedPct}%` }} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Training                                                           */
/* ------------------------------------------------------------------ */

export const TrainingWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.training) return null;
  return (
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
  );
};

/* ------------------------------------------------------------------ */
/*  Docs Approval                                                      */
/* ------------------------------------------------------------------ */

export const DocsApprovalWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.documents) return null;
  return (
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
      {summary.documents.pendingDocs && summary.documents.pendingDocs.length > 0 && (
        <div className="space-y-2">
          {summary.documents.pendingDocs.map((doc: any) => (
            <div key={doc.id ?? doc.code} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-asvo-text">{doc.code}</span>
                <span className="text-xs text-asvo-text-mid truncate">{doc.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Complaints                                                         */
/* ------------------------------------------------------------------ */

export const ComplaintsWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.complaints) return null;
  return (
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
  );
};

/* ------------------------------------------------------------------ */
/*  Next Audit                                                         */
/* ------------------------------------------------------------------ */

export const AuditWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.audits?.next) return null;
  const a = summary.audits.next;
  const daysUntil = Math.ceil((new Date(a.plannedDate).getTime() - Date.now()) / 86400000);
  return (
    <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
        <ClipboardCheck size={14} className="text-asvo-text-dim" />
        Ближайший аудит
      </h3>
      <div className="space-y-2 text-xs">
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
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Management Review                                                  */
/* ------------------------------------------------------------------ */

export const ManagementReviewWidget: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  if (!summary.review) return null;
  return (
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
  );
};
