import React, { useState } from "react";
import {
  MessageSquareWarning,
  Plus,
  Download,
  Clock,
  AlertTriangle,
  Timer,
  Shield,
} from "lucide-react";
import KpiRow from "../../components/qms/KpiRow";
import TabBar from "../../components/qms/TabBar";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import DataTable from "../../components/qms/DataTable";
import Card from "../../components/qms/Card";
import SectionTitle from "../../components/qms/SectionTitle";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Severity = "CRITICAL" | "MAJOR" | "MINOR" | "INFORMATIONAL";
type ComplaintStatus = "RECEIVED" | "UNDER_REVIEW" | "INVESTIGATING" | "RESOLVED" | "CLOSED" | "REJECTED";
type Source = "CUSTOMER" | "DISTRIBUTOR" | "INTERNAL" | "REGULATOR" | "FIELD_REPORT";

interface ComplaintRow {
  [key: string]: unknown;
  id: string;
  date: string;
  source: Source;
  product: string;
  description: string;
  severity: Severity;
  status: ComplaintStatus;
  owner: string;
  ncRef: string;
  capaRef: string;
  isReportable?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Display name maps                                                  */
/* ------------------------------------------------------------------ */

const SOURCE_LABELS: Record<Source, string> = {
  CUSTOMER: "Заказчик",
  DISTRIBUTOR: "Дистрибьютор",
  INTERNAL: "Внутренний",
  REGULATOR: "Регулятор",
  FIELD_REPORT: "Полевой отчёт",
};

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  RECEIVED: "Получена",
  UNDER_REVIEW: "На рассмотрении",
  INVESTIGATING: "Расследование",
  RESOLVED: "Решена",
  CLOSED: "Закрыта",
  REJECTED: "Отклонена",
};

/* ------------------------------------------------------------------ */
/*  Badge color maps                                                   */
/* ------------------------------------------------------------------ */

const SEVERITY_COLORS: Record<Severity, { color: string; bg: string }> = {
  CRITICAL:      { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  MAJOR:         { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  MINOR:         { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  INFORMATIONAL: { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
};

const STATUS_COLORS: Record<ComplaintStatus, { color: string; bg: string }> = {
  RECEIVED:      { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  UNDER_REVIEW:  { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  INVESTIGATING: { color: "#A06AE8", bg: "rgba(160,106,232,0.12)" },
  RESOLVED:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  CLOSED:        { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  REJECTED:      { color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

/* ------------------------------------------------------------------ */
/*  Source distribution colors                                         */
/* ------------------------------------------------------------------ */

const SOURCE_COLORS: Record<Source, string> = {
  CUSTOMER: "#4A90E8",
  DISTRIBUTOR: "#A06AE8",
  INTERNAL: "#E8A830",
  REGULATOR: "#F06060",
  FIELD_REPORT: "#2DD4A8",
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const COMPLAINTS: ComplaintRow[] = [
  {
    id: "CMP-2026-001",
    date: "01.02.2026",
    source: "CUSTOMER",
    product: "DEXA-PRO 3000",
    description: "Погрешность измерения BMD выше нормы",
    severity: "MAJOR",
    status: "INVESTIGATING",
    owner: "Костюков И.",
    ncRef: "NC-047",
    capaRef: "\u2014",
  },
  {
    id: "CMP-2026-002",
    date: "05.02.2026",
    source: "DISTRIBUTOR",
    product: "AXR-100",
    description: "Повреждение упаковки при транспортировке",
    severity: "MINOR",
    status: "CLOSED",
    owner: "Яровой Е.",
    ncRef: "\u2014",
    capaRef: "\u2014",
  },
  {
    id: "CMP-2026-003",
    date: "08.02.2026",
    source: "REGULATOR",
    product: "DEXA-PRO 3000",
    description: "Несоответствие маркировки требованиям",
    severity: "MAJOR",
    status: "RECEIVED",
    owner: "Холтобин А.",
    ncRef: "\u2014",
    capaRef: "\u2014",
    isReportable: true,
  },
  {
    id: "CMP-2026-004",
    date: "10.02.2026",
    source: "INTERNAL",
    product: "DensiBot v2",
    description: "Сбой ПО при калибровке",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    owner: "Чирков И.",
    ncRef: "NC-051",
    capaRef: "CAPA-019",
  },
  {
    id: "CMP-2026-005",
    date: "11.02.2026",
    source: "CUSTOMER",
    product: "AXR-100",
    description: "Некорректные показания после 6 мес эксплуатации",
    severity: "MAJOR",
    status: "UNDER_REVIEW",
    owner: "\u2014",
    ncRef: "\u2014",
    capaRef: "\u2014",
  },
];

/* ------------------------------------------------------------------ */
/*  Source distribution data                                           */
/* ------------------------------------------------------------------ */

interface SourceStat {
  source: Source;
  count: number;
  pct: number;
}

const SOURCE_STATS: SourceStat[] = [
  { source: "CUSTOMER",     count: 2, pct: 40 },
  { source: "DISTRIBUTOR",  count: 1, pct: 20 },
  { source: "REGULATOR",    count: 1, pct: 20 },
  { source: "INTERNAL",     count: 1, pct: 20 },
  { source: "FIELD_REPORT", count: 0, pct: 0 },
];

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "registry",  label: "Реестр" },
  { key: "sources",   label: "По источникам" },
  { key: "analytics", label: "Аналитика" },
];

/* ------------------------------------------------------------------ */
/*  Table columns                                                      */
/* ------------------------------------------------------------------ */

const columns = [
  {
    key: "id",
    label: "ID",
    width: "130px",
    render: (r: ComplaintRow) => (
      <span className="font-mono text-asvo-accent">{r.id}</span>
    ),
  },
  {
    key: "date",
    label: "Дата",
    width: "100px",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.date}</span>
    ),
  },
  {
    key: "source",
    label: "Источник",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{SOURCE_LABELS[r.source]}</span>
    ),
  },
  {
    key: "product",
    label: "Продукт",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text">{r.product}</span>
    ),
  },
  {
    key: "description",
    label: "Описание",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.description}</span>
    ),
  },
  {
    key: "severity",
    label: "Серьёзность",
    align: "center" as const,
    render: (r: ComplaintRow) => {
      const c = SEVERITY_COLORS[r.severity];
      return <Badge color={c.color} bg={c.bg}>{r.severity}</Badge>;
    },
  },
  {
    key: "status",
    label: "Статус",
    align: "center" as const,
    render: (r: ComplaintRow) => {
      const c = STATUS_COLORS[r.status];
      return <Badge color={c.color} bg={c.bg}>{STATUS_LABELS[r.status]}</Badge>;
    },
  },
  {
    key: "owner",
    label: "Ответственный",
    render: (r: ComplaintRow) => (
      <span className="text-asvo-text-mid">{r.owner}</span>
    ),
  },
  {
    key: "ncRef",
    label: "NC",
    align: "center" as const,
    render: (r: ComplaintRow) =>
      r.ncRef !== "\u2014" ? (
        <Badge color="#F06060" bg="rgba(240,96,96,0.12)">{r.ncRef}</Badge>
      ) : (
        <span className="text-asvo-text-dim">{r.ncRef}</span>
      ),
  },
  {
    key: "capaRef",
    label: "CAPA",
    align: "center" as const,
    render: (r: ComplaintRow) =>
      r.capaRef !== "\u2014" ? (
        <Badge color="#E8A830" bg="rgba(232,168,48,0.12)">{r.capaRef}</Badge>
      ) : (
        <span className="text-asvo-text-dim">{r.capaRef}</span>
      ),
  },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ComplaintsPage: React.FC = () => {
  const [tab, setTab] = useState("registry");

  /* ---- KPI ---- */
  const kpis = [
    { label: "Всего рекламаций",          value: 5,     icon: <MessageSquareWarning size={18} />, color: "#4A90E8" },
    { label: "Открытых",                   value: 3,     icon: <Clock size={18} />,                color: "#E8A830" },
    { label: "Критических",                value: 1,     icon: <AlertTriangle size={18} />,        color: "#F06060" },
    { label: "Среднее время закрытия дн.",  value: 12,    icon: <Timer size={18} />,                color: "#2DD4A8" },
    { label: "Требуют уведомления",        value: 1,     icon: <Shield size={18} />,               color: "#F06060" },
  ];

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-asvo-blue-dim rounded-xl">
            <MessageSquareWarning size={22} className="text-asvo-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Рекламации</h1>
            <p className="text-xs text-asvo-text-dim">ISO 13485 &sect;8.2.2 &mdash; Обратная связь от потребителей</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={15} />}>+ Новая рекламация</ActionBtn>
          <ActionBtn variant="secondary" icon={<Download size={15} />}>Экспорт</ActionBtn>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow items={kpis} />

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ---- TAB: Registry ---- */}
      {tab === "registry" && <DataTable columns={columns} data={COMPLAINTS} />}

      {/* ---- TAB: Sources ---- */}
      {tab === "sources" && (
        <Card>
          <SectionTitle>Распределение по источникам</SectionTitle>

          {/* Bar chart visualization */}
          <div className="space-y-4">
            {SOURCE_STATS.map((s) => (
              <div key={s.source} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-asvo-text">{SOURCE_LABELS[s.source]}</span>
                  <span className="text-[13px] font-semibold text-asvo-text-mid">
                    {s.count} ({s.pct}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-asvo-surface border border-asvo-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: SOURCE_COLORS[s.source],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pie chart visualization (static) */}
          <div className="mt-8">
            <SectionTitle>Визуализация</SectionTitle>

            <div className="flex items-center justify-center gap-10">
              {/* Static pie representation */}
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* CUSTOMER 40% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={SOURCE_COLORS.CUSTOMER}
                    strokeWidth="20"
                    strokeDasharray={`${40 * 2.512} ${100 * 2.512}`}
                    strokeDashoffset="0"
                  />
                  {/* DISTRIBUTOR 20% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={SOURCE_COLORS.DISTRIBUTOR}
                    strokeWidth="20"
                    strokeDasharray={`${20 * 2.512} ${100 * 2.512}`}
                    strokeDashoffset={`${-40 * 2.512}`}
                  />
                  {/* REGULATOR 20% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={SOURCE_COLORS.REGULATOR}
                    strokeWidth="20"
                    strokeDasharray={`${20 * 2.512} ${100 * 2.512}`}
                    strokeDashoffset={`${-60 * 2.512}`}
                  />
                  {/* INTERNAL 20% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={SOURCE_COLORS.INTERNAL}
                    strokeWidth="20"
                    strokeDasharray={`${20 * 2.512} ${100 * 2.512}`}
                    strokeDashoffset={`${-80 * 2.512}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-asvo-text">5</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5">
                {SOURCE_STATS.filter((s) => s.count > 0).map((s) => (
                  <div key={s.source} className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: SOURCE_COLORS[s.source] }}
                    />
                    <span className="text-[13px] text-asvo-text-mid">
                      {SOURCE_LABELS[s.source]}
                    </span>
                    <span className="text-[13px] font-semibold text-asvo-text">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ---- TAB: Analytics ---- */}
      {tab === "analytics" && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-asvo-text-dim">
            <MessageSquareWarning size={40} className="mb-3 opacity-30" />
            <p className="text-[13px]">Раздел аналитики находится в разработке</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComplaintsPage;
