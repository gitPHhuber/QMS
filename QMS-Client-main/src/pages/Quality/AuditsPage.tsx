import React, { useState } from "react";
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

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
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

const AUDITS: AuditRow[] = [
  { id: "AUD-012", type: "Внутренний", process: "Закупки (п.7.4)",       auditor: "Костюков И.",   date: "10.02.2026", status: "in_progress", findings: 4, result: "\u2014" },
  { id: "AUD-011", type: "Внутренний", process: "Производство (п.7.5)",  auditor: "Холтобин А.",   date: "25.01.2026", status: "completed",   findings: 6, result: "Соответствует" },
  { id: "AUD-010", type: "Внешний",    process: "СМК (полный)",          auditor: "Bureau Veritas", date: "15.01.2026", status: "completed",   findings: 2, result: "Соответствует" },
  { id: "AUD-009", type: "Внутренний", process: "NC/CAPA (п.8.3\u20138.5)", auditor: "Яровой Е.",  date: "10.12.2025", status: "completed",   findings: 5, result: "Условно" },
  { id: "AUD-008", type: "Поставщика", process: "SUP-012",              auditor: "Костюков И.",   date: "01.12.2025", status: "completed",   findings: 8, result: "Не соответствует" },
  { id: "AUD-007", type: "Внутренний", process: "Документы (п.4.2)",    auditor: "Омельченко А.", date: "15.11.2025", status: "completed",   findings: 3, result: "Соответствует" },
];

/* ---- Annual plan grid ---- */

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

const ISO_PROCESSES = [
  "4.2 Документы",
  "7.1 Планирование",
  "7.4 Закупки",
  "7.5 Производство",
  "8.2 Мониторинг",
  "8.3 NC",
  "8.5 CAPA",
  "6.2 Персонал",
];

type CellState = "empty" | "planned" | "done";

// Seeded annual plan matrix  (row = process, col = month)
const PLAN_GRID: CellState[][] = [
  /* 4.2 */ ["done","empty","planned","empty","empty","empty","done","empty","empty","planned","empty","empty"],
  /* 7.1 */ ["empty","done","empty","empty","planned","empty","empty","done","empty","empty","planned","empty"],
  /* 7.4 */ ["empty","empty","done","empty","empty","planned","empty","empty","done","empty","empty","planned"],
  /* 7.5 */ ["done","empty","empty","done","empty","empty","planned","empty","empty","done","empty","empty"],
  /* 8.2 */ ["empty","planned","empty","empty","done","empty","empty","planned","empty","empty","done","empty"],
  /* 8.3 */ ["empty","empty","empty","done","empty","empty","done","empty","planned","empty","empty","done"],
  /* 8.5 */ ["empty","empty","planned","empty","empty","done","empty","empty","empty","planned","empty","done"],
  /* 6.2 */ ["planned","empty","empty","empty","done","empty","empty","empty","done","empty","empty","planned"],
];

/* ---- Findings classification ---- */

const FINDINGS = [
  { label: "Критические",    count: 3,  pct: 15, color: "red"   as const },
  { label: "Значительные",   count: 8,  pct: 40, color: "amber" as const },
  { label: "Незначительные", count: 18, pct: 70, color: "blue"  as const },
  { label: "Наблюдения",     count: 5,  pct: 30, color: "accent" as const },
];

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

const FOLLOW_UPS: FollowUpRow[] = [
  { auditId: "AUD-012", finding: "Отсутствие входного контроля PCB", type: "Значительное", responsible: "Яровой Е.", dueDate: "10.03.2026", status: "OPEN", daysLeft: 28, correctiveAction: "Разработать чек-лист входного контроля" },
  { auditId: "AUD-012", finding: "Нет записей о квалификации поставщика ЭКБ", type: "Незначительное", responsible: "Костюков И.", dueDate: "28.02.2026", status: "IN_PROGRESS", daysLeft: 16, correctiveAction: "Провести аудит поставщика" },
  { auditId: "AUD-011", finding: "Просрочены калибровки 2 паяльных станций", type: "Значительное", responsible: "Чирков И.", dueDate: "15.02.2026", status: "IN_PROGRESS", daysLeft: 3, correctiveAction: "Калибровка JBC и HAKKO" },
  { auditId: "AUD-009", finding: "NC-045 не закрыт в срок (> 30 дн)", type: "Критическое", responsible: "Костюков И.", dueDate: "05.02.2026", status: "OVERDUE", daysLeft: -7, correctiveAction: "Эскалация в CAPA-019" },
  { auditId: "AUD-009", finding: "Неполные записи root cause analysis", type: "Незначительное", responsible: "Яровой Е.", dueDate: "01.02.2026", status: "CLOSED", daysLeft: 0, correctiveAction: "Обновлён шаблон RCA" },
  { auditId: "AUD-008", finding: "SUP-012: отсутствует сертификат ISO 9001", type: "Критическое", responsible: "Холтобин А.", dueDate: "01.02.2026", status: "ESCALATED", daysLeft: -11, correctiveAction: "Замена поставщика (ECR-2026-005)" },
];

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
        const s = STATUS_CFG[r.status];
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
          <ActionBtn variant="primary" icon={<Plus size={15} />}>+ Новый аудит</ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow
        items={[
          { label: "Всего аудитов", value: 18, icon: <ClipboardCheck size={18} />, color: "#4A90E8" },
          { label: "Выполнено",     value: 12, icon: <CheckCircle2 size={18} />,   color: "#2DD4A8" },
          { label: "Замечаний",     value: 34, icon: <AlertTriangle size={18} />,   color: "#E8A830" },
          { label: "Соответствие",  value: "92%", icon: <BarChart3 size={18} />,    color: "#2DD4A8" },
        ]}
      />

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ---- TAB: Registry ---- */}
      {tab === "registry" && <DataTable columns={columns} data={AUDITS} />}

      {/* ---- TAB: Annual Plan ---- */}
      {tab === "plan" && (
        <Card>
          <SectionTitle>Годовой план аудитов 2026</SectionTitle>

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
                {ISO_PROCESSES.map((proc, ri) => (
                  <tr key={proc} className="border-t border-asvo-border/40">
                    <td className="px-2 py-2 text-[12px] text-asvo-text-mid whitespace-nowrap">{proc}</td>
                    {PLAN_GRID[ri].map((cell, ci) => (
                      <td key={ci} className="px-1 py-2 text-center">
                        <div className={`w-4 h-4 rounded-[3px] mx-auto ${cellCls[cell]}`} />
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
        </Card>
      )}

      {/* ---- TAB: Findings ---- */}
      {tab === "findings" && (
        <Card>
          <SectionTitle>Классификация замечаний</SectionTitle>

          <div className="space-y-4">
            {FINDINGS.map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-asvo-text">{f.label}</span>
                  <span className="text-[13px] font-semibold text-asvo-text-mid">{f.count} ({f.pct}%)</span>
                </div>
                <ProgressBar value={f.pct} color={f.color} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- TAB: Follow-up ---- */}
      {tab === "followup" && (
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
                const s = FOLLOW_STATUS_CFG[r.status];
                return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
              },
            },
            {
              key: "daysLeft",
              label: "Дней",
              align: "center" as const,
              render: (r: FollowUpRow) => {
                if (r.status === "CLOSED") return <span className="text-asvo-text-dim">\u2014</span>;
                const isOverdue = r.daysLeft < 0;
                return (
                  <span className={`text-[12px] font-semibold ${isOverdue ? "text-[#F06060]" : r.daysLeft <= 5 ? "text-[#E8A830]" : "text-asvo-text-mid"}`}>
                    {isOverdue ? `${Math.abs(r.daysLeft)} проср.` : `${r.daysLeft} ост.`}
                  </span>
                );
              },
            },
          ]}
          data={FOLLOW_UPS}
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
