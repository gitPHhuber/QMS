import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  ArrowUpCircle,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import TabBar from "../../components/qms/TabBar";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import ProgressBar from "../../components/qms/ProgressBar";
import SectionTitle from "../../components/qms/SectionTitle";
import Card from "../../components/qms/Card";

import { internalAuditsApi } from "../../api/qmsApi";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface AuditRow {
  [key: string]: unknown;
  id: string;
  type: string;
  process: string;
  auditor: string;
  date: string;
  status: "completed" | "in_progress" | "planned" | "cancelled";
  findings: number;
  result: string;
}

/* ---- Annual plan grid ---- */

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

type CellState = "empty" | "planned" | "done";

/* ---- Status badge mapping ---- */

const STATUS_CFG: Record<AuditRow["status"], { label: string; color: string; bg: string }> = {
  completed:   { label: "Завершён",     color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  in_progress: { label: "В процессе",   color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  planned:     { label: "Запланирован", color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  cancelled:   { label: "Отменён",      color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ---- Result badge color ---- */

const resultColor = (r: string) => {
  if (r === "Соответствует")      return { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" };
  if (r === "Условно")            return { color: "#E8A830", bg: "rgba(232,168,48,0.12)" };
  if (r === "Не соответствует")   return { color: "#F06060", bg: "rgba(240,96,96,0.12)" };
  return undefined;
};

/* ---- Follow-up data ---- */

type FollowUpStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "OVERDUE" | "ESCALATED";

interface FollowUpRow {
  [key: string]: unknown;
  auditId: string;
  finding: string;
  type: string;
  responsible: string;
  dueDate: string;
  status: FollowUpStatus;
  daysLeft: number;
  correctiveAction: string;
}

const FOLLOW_STATUS_CFG: Record<FollowUpStatus, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Открыто",    color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  IN_PROGRESS: { label: "В работе",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  CLOSED:      { label: "Закрыто",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  OVERDUE:     { label: "Просрочено", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  ESCALATED:   { label: "Эскалация",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const FINDING_TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  "Критическое":    { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  "Значительное":   { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  "Незначительное":  { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
};

/* ---- Tabs ---- */

const TABS = [
  { key: "registry",  label: "Реестр" },
  { key: "plan",      label: "Годовой план" },
  { key: "findings",  label: "Замечания" },
  { key: "followup",  label: "Follow-up" },
  { key: "reports",   label: "Отчёты" },
];

/* ---- Cell color for annual plan ---- */

const cellCls: Record<CellState, string> = {
  planned: "bg-asvo-blue-dim border border-asvo-blue/30",
  done:    "bg-asvo-accent-dim border border-asvo-accent/30",
  empty:   "bg-asvo-surface border border-asvo-border",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const AuditsPage: React.FC = () => {
  const [tab, setTab] = useState("registry");

  /* ---- API state ---- */
  const [plans, setPlans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch data ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, schedulesRes, statsRes] = await Promise.all([
        internalAuditsApi.getPlans(),
        internalAuditsApi.getSchedules(),
        internalAuditsApi.getStats(),
      ]);
      setPlans(plansRes.rows ?? []);
      setSchedules(schedulesRes.rows ?? []);
      setStats(statsRes);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки данных аудитов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derive audit rows from schedules ---- */
  const auditRows: AuditRow[] = schedules.map((s: any) => ({
    id: s.number || s.id?.toString() || "",
    type: s.type || "Внутренний",
    process: s.process || s.clause || "",
    auditor: s.auditor?.name
      ? `${s.auditor.surname || ""} ${s.auditor.name?.charAt(0) || ""}.`.trim()
      : s.auditorName || "",
    date: s.scheduledDate
      ? new Date(s.scheduledDate).toLocaleDateString("ru-RU")
      : "",
    status: s.status?.toLowerCase() as AuditRow["status"] || "planned",
    findings: s.findingsCount ?? s.findings?.length ?? 0,
    result: s.result || "\u2014",
  }));

  /* ---- Derive annual plan grid from plans ---- */
  const planProcesses: string[] = plans.map(
    (p: any) => p.process || p.clause || p.title || ""
  );

  const planGrid: CellState[][] = plans.map((p: any) => {
    if (p.grid && Array.isArray(p.grid)) return p.grid as CellState[];
    if (p.months && Array.isArray(p.months)) {
      return MONTHS.map((_m, idx) => {
        const monthVal = p.months[idx];
        if (monthVal === "done" || monthVal === "completed") return "done" as CellState;
        if (monthVal === "planned" || monthVal === "scheduled") return "planned" as CellState;
        return "empty" as CellState;
      });
    }
    // Derive from schedules associated with this plan
    const row: CellState[] = Array(12).fill("empty");
    if (p.schedules && Array.isArray(p.schedules)) {
      p.schedules.forEach((sch: any) => {
        const d = sch.scheduledDate ? new Date(sch.scheduledDate) : null;
        if (d) {
          const mIdx = d.getMonth();
          const st = sch.status?.toLowerCase();
          row[mIdx] = st === "completed" || st === "done" ? "done" : "planned";
        }
      });
    }
    return row;
  });

  /* ---- Derive findings from stats ---- */
  const findingsData: { label: string; count: number; pct: number; color: "red" | "amber" | "blue" | "accent" }[] =
    stats?.findings
      ? stats.findings.map((f: any) => ({
          label: f.label || f.type || "",
          count: Number(f.count) || 0,
          pct: Number(f.pct) || 0,
          color: f.color || "blue",
        }))
      : stats?.bySeverity
        ? stats.bySeverity.map((f: any) => {
            const total = stats.bySeverity.reduce(
              (sum: number, x: any) => sum + Number(x.count),
              0
            );
            const count = Number(f.count) || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const colorMap: Record<string, "red" | "amber" | "blue" | "accent"> = {
              critical: "red",
              major: "amber",
              minor: "blue",
              observation: "accent",
            };
            const labelMap: Record<string, string> = {
              critical: "Критические",
              major: "Значительные",
              minor: "Незначительные",
              observation: "Наблюдения",
            };
            const key = (f.severity || f.type || "").toLowerCase();
            return {
              label: labelMap[key] || f.severity || f.type || "",
              count,
              pct,
              color: colorMap[key] || "blue",
            };
          })
        : [];

  /* ---- Derive follow-up rows from stats or schedules ---- */
  const followUpRows: FollowUpRow[] = (stats?.followUps || stats?.followups || []).map(
    (f: any) => ({
      auditId: f.auditId || f.auditNumber || "",
      finding: f.finding || f.description || "",
      type: f.type || f.severity || "",
      responsible: f.responsible || f.assignedTo?.name
        ? `${f.assignedTo?.surname || ""} ${f.assignedTo?.name?.charAt(0) || ""}.`.trim()
        : "",
      dueDate: f.dueDate
        ? new Date(f.dueDate).toLocaleDateString("ru-RU")
        : "",
      status: (f.status || "OPEN") as FollowUpStatus,
      daysLeft: f.daysLeft ?? (f.dueDate
        ? Math.ceil((new Date(f.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0),
      correctiveAction: f.correctiveAction || f.action || "",
    })
  );

  /* ---- KPI values from stats ---- */
  const kpiItems = stats
    ? [
        {
          label: "Всего аудитов",
          value: stats.totalAudits ?? stats.total ?? schedules.length,
          icon: <ClipboardCheck size={18} />,
          color: "#4A90E8",
        },
        {
          label: "Выполнено",
          value: stats.completedAudits ?? stats.completed ?? 0,
          icon: <CheckCircle2 size={18} />,
          color: "#2DD4A8",
        },
        {
          label: "Замечаний",
          value: stats.totalFindings ?? stats.findingsCount ?? 0,
          icon: <AlertTriangle size={18} />,
          color: "#E8A830",
        },
        {
          label: "Соответствие",
          value: stats.conformance
            ? `${stats.conformance}%`
            : stats.conformanceRate
              ? `${stats.conformanceRate}%`
              : "\u2014",
          icon: <BarChart3 size={18} />,
          color: "#2DD4A8",
        },
      ]
    : [
        { label: "Всего аудитов", value: 0, icon: <ClipboardCheck size={18} />, color: "#4A90E8" },
        { label: "Выполнено",     value: 0, icon: <CheckCircle2 size={18} />,   color: "#2DD4A8" },
        { label: "Замечаний",     value: 0, icon: <AlertTriangle size={18} />,   color: "#E8A830" },
        { label: "Соответствие",  value: "\u2014", icon: <BarChart3 size={18} />,    color: "#2DD4A8" },
      ];

  /* ---- columns for DataTable ---- */

  const columns = [
    {
      key: "id",
      label: "ID",
      width: "100px",
      render: (r: AuditRow) => (
        <span className="font-mono text-asvo-accent">{r.id}</span>
      ),
    },
    { key: "type", label: "Тип аудита", render: (r: AuditRow) => <span className="text-asvo-text">{r.type}</span> },
    { key: "process", label: "Процесс", render: (r: AuditRow) => <span className="text-asvo-text-mid">{r.process}</span> },
    { key: "auditor", label: "Аудитор", render: (r: AuditRow) => <span className="text-asvo-text-mid">{r.auditor}</span> },
    {
      key: "date",
      label: "Дата",
      render: (r: AuditRow) => (
        <span className="flex items-center gap-1 text-asvo-text-mid">
          <Calendar size={12} className="text-asvo-text-dim" />
          {r.date}
        </span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      align: "center" as const,
      render: (r: AuditRow) => {
        const s = STATUS_CFG[r.status] || STATUS_CFG.planned;
        return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
      },
    },
    {
      key: "findings",
      label: "Замечаний",
      align: "center" as const,
      render: (r: AuditRow) => <span className="text-asvo-text-mid">{r.findings}</span>,
    },
    {
      key: "result",
      label: "Результат",
      align: "center" as const,
      render: (r: AuditRow) => {
        const rc = resultColor(r.result);
        return rc ? <Badge color={rc.color} bg={rc.bg}>{r.result}</Badge> : <span className="text-asvo-text-dim">{r.result}</span>;
      },
    },
  ];

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-asvo-blue-dim rounded-xl">
            <ClipboardCheck size={22} className="text-asvo-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Аудиты</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;8.2.4 &mdash; Программа внутренних аудитов</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />} disabled title="Будет доступно в следующем спринте">+ Новый аудит</ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />} disabled title="Будет доступно в следующем спринте">Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow items={kpiItems} />

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ---- Error State ---- */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
          <span className="text-red-400 text-[13px] flex-1">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchData}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* ---- Loading State ---- */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* ---- TAB: Registry ---- */}
      {!loading && !error && tab === "registry" && (
        <DataTable columns={columns} data={auditRows} />
      )}

      {/* ---- TAB: Annual Plan ---- */}
      {!loading && !error && tab === "plan" && (
        <Card>
          <SectionTitle>Годовой план аудитов 2026</SectionTitle>

          {planProcesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
              <Calendar size={40} className="mb-3 opacity-30" />
              <p className="text-[13px]">Нет данных годового плана</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-2 py-2 w-40">
                        Процесс
                      </th>
                      {MONTHS.map((m) => (
                        <th key={m} className="text-center text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider px-1 py-2">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planProcesses.map((proc, ri) => (
                      <tr key={proc + ri} className="border-t border-asvo-border/40">
                        <td className="px-2 py-2 text-[12px] text-asvo-text-mid whitespace-nowrap">{proc}</td>
                        {(planGrid[ri] || Array(12).fill("empty")).map((cell: CellState, ci: number) => (
                          <td key={ci} className="px-1 py-2 text-center">
                            <div className={`w-4 h-4 rounded-[3px] mx-auto ${cellCls[cell] || cellCls.empty}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-4 text-[11px] text-asvo-text-dim">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-asvo-blue-dim border border-asvo-blue/30" /> Запланирован
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-asvo-accent-dim border border-asvo-accent/30" /> Выполнен
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-asvo-surface border border-asvo-border" /> Пусто
                </span>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ---- TAB: Findings ---- */}
      {!loading && !error && tab === "findings" && (
        <Card>
          <SectionTitle>Классификация замечаний</SectionTitle>

          {findingsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
              <AlertTriangle size={40} className="mb-3 opacity-30" />
              <p className="text-[13px]">Нет данных о замечаниях</p>
            </div>
          ) : (
            <div className="space-y-4">
              {findingsData.map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-asvo-text">{f.label}</span>
                    <span className="text-[13px] font-semibold text-asvo-text-mid">{f.count} ({f.pct}%)</span>
                  </div>
                  <ProgressBar value={f.pct} color={f.color} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ---- TAB: Follow-up ---- */}
      {!loading && !error && tab === "followup" && (
        <DataTable
          columns={[
            {
              key: "auditId",
              label: "Аудит",
              width: "100px",
              render: (r: FollowUpRow) => <span className="font-mono text-asvo-accent">{r.auditId}</span>,
            },
            {
              key: "finding",
              label: "Замечание",
              render: (r: FollowUpRow) => <span className="text-asvo-text text-[12px]">{r.finding}</span>,
            },
            {
              key: "type",
              label: "Тип",
              align: "center" as const,
              render: (r: FollowUpRow) => {
                const tc = FINDING_TYPE_COLOR[r.type];
                return tc ? <Badge color={tc.color} bg={tc.bg}>{r.type}</Badge> : <span className="text-asvo-text-mid">{r.type}</span>;
              },
            },
            {
              key: "correctiveAction",
              label: "Корр. действие",
              render: (r: FollowUpRow) => <span className="text-asvo-text-mid text-[12px]">{r.correctiveAction}</span>,
            },
            {
              key: "responsible",
              label: "Ответственный",
              render: (r: FollowUpRow) => <span className="text-asvo-text-mid">{r.responsible}</span>,
            },
            {
              key: "dueDate",
              label: "Срок",
              render: (r: FollowUpRow) => (
                <span className="flex items-center gap-1 text-asvo-text-mid">
                  <Clock size={12} className="text-asvo-text-dim" />
                  {r.dueDate}
                </span>
              ),
            },
            {
              key: "status",
              label: "Статус",
              align: "center" as const,
              render: (r: FollowUpRow) => {
                const s = FOLLOW_STATUS_CFG[r.status] || FOLLOW_STATUS_CFG.OPEN;
                return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
              },
            },
            {
              key: "daysLeft",
              label: "Дней",
              align: "center" as const,
              render: (r: FollowUpRow) => {
                if (r.status === "CLOSED") return <span className="text-asvo-text-dim">{"\u2014"}</span>;
                const isOverdue = r.daysLeft < 0;
                return (
                  <span className={`text-[12px] font-semibold ${isOverdue ? "text-[#F06060]" : r.daysLeft <= 5 ? "text-[#E8A830]" : "text-asvo-text-mid"}`}>
                    {isOverdue ? `${Math.abs(r.daysLeft)} проср.` : `${r.daysLeft} ост.`}
                  </span>
                );
              },
            },
          ]}
          data={followUpRows}
        />
      )}

      {/* ---- TAB: Reports ---- */}
      {tab === "reports" && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
            <BarChart3 size={40} className="mb-3 opacity-30" />
            <p className="text-[13px]">Раздел отчётов находится в разработке</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuditsPage;
