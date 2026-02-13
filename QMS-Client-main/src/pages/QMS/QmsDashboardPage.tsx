/**
 * QmsDashboardPage.tsx — Главный дашборд ASVO-QMS
 * Dark-theme dashboard с KPI, Risk Matrix, Timeline и виджетами
 * Подключён к реальному backend API (все mock-данные заменены).
 */

import React, { useState, useEffect } from "react";
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
  Loader2,
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
/*  Helpers (pure — not dependent on API data)                         */
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

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

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
                    const hasValue = count !== null && count !== 0;

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
                ))}
              </div>
            ) : (
              <p className="text-xs text-asvo-text-dim">Нет предстоящих калибровок</p>
            )}
          </div>
        )}

        {/* ---------- Widget: Поставщики ---------- */}
        {show(true, false, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-asvo-text mb-3 flex items-center gap-2">
              <Truck size={14} className="text-asvo-text-dim" />
              Поставщики
            </h3>

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

        {/* ---------- Widget: Обучение по отделам ---------- */}
        {show(true, true, true) && (
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
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
